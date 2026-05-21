'use server'

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import BookingConfirmation from '@/components/emails/BookingConfirmation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React from 'react';
import { z } from 'zod';

import { google } from 'googleapis';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Configuración de Google Calendar ──────────────────────────
function getGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }
  
  // Limpiar la llave privada y el email de comillas que a veces se copian por error en Netlify
  const cleanEmail = process.env.GOOGLE_CLIENT_EMAIL.replace(/"/g, '').trim();
  const cleanKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '').trim();

  return new google.auth.JWT({
    email: cleanEmail,
    key: cleanKey,
    scopes: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly']
  });
}

// ─── Esquema de validación con Zod ─────────────────────────────
const bookingSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres.')
    .max(100, 'El apellido no puede exceder 100 caracteres.'),
  email: z
    .string()
    .email('El correo electrónico no es válido. Verifique el formato (ej: correo@ejemplo.com).'),
  whatsapp: z
    .string()
    .min(7, 'El número de WhatsApp debe tener al menos 7 dígitos.')
    .max(20, 'El número de WhatsApp no puede exceder 20 caracteres.')
    .regex(/^[\d\s\+\-\(\)]+$/, 'El número de WhatsApp solo puede contener dígitos, espacios, +, - o paréntesis.'),
  ciudad: z.enum(['Valencia', 'Caracas', 'La Guaira', 'Tucacas', 'Virtual'] as const, {
    message: 'Debe seleccionar una sede o modalidad válida.',
  }),
  fecha_hora_inicio: z
    .string()
    .datetime('La fecha de inicio no tiene un formato válido.'),
  fecha_hora_fin: z
    .string()
    .datetime('La fecha de fin no tiene un formato válido.'),
});

// ─── Códigos de error legibles para el cliente ─────────────────
function humanizeSupabaseError(code: string, message: string): string {
  switch (code) {
    case '23505': // unique_violation
      return 'Ya existe una cita agendada en esa fecha y hora. Por favor, seleccione otro horario.';
    case '23503': // foreign_key_violation
      return 'Error de referencia en la base de datos. Contacte al administrador.';
    case '42501': // insufficient_privilege (RLS)
      return 'Permiso denegado. La política de seguridad bloqueó la operación.';
    case 'PGRST301': // JWT expired
      return 'La sesión ha expirado. Por favor, recargue la página e intente de nuevo.';
    case 'PGRST204':
    case 'PGRST205':
      return 'Error de configuración del servidor. Contacte al administrador.';
    default:
      // Si el mensaje de Supabase es técnico, devolver uno genérico
      if (message.includes('duplicate key')) {
        return 'Ya existe una cita agendada en esa fecha y hora.';
      }
      if (message.includes('violates row-level security')) {
        return 'Error de permisos en la base de datos. Contacte al administrador.';
      }
      return `Error al guardar la cita: ${message}`;
  }
}

// ─── Server Action principal ──────────────────────────────────
export async function createBooking(formData: FormData) {
  const data = {
    nombre: formData.get('nombre') as string,
    apellido: formData.get('apellido') as string,
    email: formData.get('email') as string,
    whatsapp: formData.get('whatsapp') as string,
    ciudad: formData.get('ciudad') as string,
    fecha_hora_inicio: formData.get('fecha_hora_inicio') as string,
    fecha_hora_fin: formData.get('fecha_hora_fin') as string,
  };
  // 1. Validar datos con Zod
  const validation = bookingSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: firstError.message,
    };
  }

  // 2. Insertar en Supabase (primero para obtener el ID y enviarlo en el correo)
  try {
    const { data: dbData, error } = await supabase
      .from('appointments')
      .insert([validation.data])
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        success: false,
        errorCode: 'DB_ERROR',
        error: humanizeSupabaseError(error.code, error.message),
      };
    }

    const citaId = dbData.id;
    let googleEventId = null;

    // 3. Crear Evento en Google Calendar
    try {
      const auth = getGoogleAuth();
      if (auth && process.env.GOOGLE_CALENDAR_ID) {
        const calendar = google.calendar({ version: 'v3', auth });
        const calendarId = process.env.GOOGLE_CALENDAR_ID.trim();
        
        const eventResponse = await calendar.events.insert({
          calendarId: calendarId,
          requestBody: {
            summary: `Cita Legal: ${validation.data.nombre} ${validation.data.apellido}`,
            description: `Sede/Modalidad: ${validation.data.ciudad}\nCliente: ${validation.data.nombre} ${validation.data.apellido}\nEmail: ${validation.data.email}\nWhatsApp: ${validation.data.whatsapp}`,
            start: {
              dateTime: validation.data.fecha_hora_inicio,
              timeZone: 'America/Caracas',
            },
            end: {
              dateTime: validation.data.fecha_hora_fin,
              timeZone: 'America/Caracas',
            },
          },
        });
        
        googleEventId = eventResponse.data.id;
        
        // 3.1 Actualizar la base de datos con el ID del evento de Google
        if (googleEventId) {
          await supabase
            .from('appointments')
            .update({ google_event_id: googleEventId })
            .eq('id', citaId);
        }
      } else {
        console.warn('Credenciales de Google Calendar incompletas o no configuradas.');
      }
    } catch (calendarError) {
      console.error('Error al crear evento en Google Calendar:', calendarError);
      // No fallamos si el calendario falla, la cita ya está en Supabase.
    }

    // 4. Preparar formato de fechas para el correo (Asegurando zona horaria de Caracas)
    const dateObj = new Date(validation.data.fecha_hora_inicio);
    const caracasDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
    
    const fechaFormatada = format(caracasDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    const horaFormatada = format(caracasDate, "hh:mm a");

    // 4.5 Procesar archivo adjunto si existe (Solo Virtual)
    const attachments = [];
    const documento = formData.get('documento') as File | null;
    
    if (documento) {
      try {
        const arrayBuffer = await documento.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        attachments.push({
          filename: documento.name,
          content: buffer
        });
      } catch (err) {
        console.error("Error al procesar el archivo adjunto:", err);
      }
    }

    // 5. Enviar correo de confirmación con Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Román & Delgado <citas@romanydelgado.com>', 
          to: [validation.data.email],
          subject: 'Confirmación de su cita - Román & Delgado',
          react: React.createElement(BookingConfirmation, {
            nombre: `${validation.data.nombre} ${validation.data.apellido}`,
            ciudad: validation.data.ciudad,
            fecha: fechaFormatada,
            hora: horaFormatada,
            citaId: citaId, // Pasamos el ID real a la plantilla
          }),
          attachments: attachments.length > 0 ? attachments : undefined,
        });
      } catch (emailError) {
        console.error('Error enviando el correo con Resend:', emailError);
      }
    } else {
      console.warn("RESEND_API_KEY no configurada. El correo de confirmación no fue enviado.");
    }

    return { success: true };
  } catch (err: any) {
    console.error('Server action error:', err);
    return {
      success: false,
      errorCode: 'SERVER_ERROR',
      error: 'Error de conexión con el servidor. Verifique su conexión a internet e intente nuevamente.',
    };
  }
}

// ─── Consultar Disponibilidad en Tiempo Real ───────────────────
export async function getAvailableTimeSlots(dateString: string) {
  // dateString debe tener el formato "YYYY-MM-DD"
  // Horario: 9am a 6pm, pausa de almuerzo de 12pm a 2pm.
  const allStandardSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
  
  // Obtener la hora actual en Caracas
  const now = new Date();
  const caracasNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
  const todayString = format(caracasNow, 'yyyy-MM-dd');
  
  let standardSlots = allStandardSlots;
  
  // Si el cliente está consultando la disponibilidad para HOY, filtramos las horas que ya pasaron
  if (dateString === todayString) {
    const currentHour = caracasNow.getHours();
    const currentMinute = caracasNow.getMinutes();
    
    standardSlots = allStandardSlots.filter(slot => {
      const [slotHour, slotMinute] = slot.split(':').map(Number);
      // Damos un margen de 15 minutos (no se puede agendar una cita a las 2:00 PM si son las 1:50 PM)
      if (slotHour > currentHour) return true;
      if (slotHour === currentHour && slotMinute > currentMinute + 15) return true;
      return false;
    });
  }
  
  try {
    const auth = getGoogleAuth();
    const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
    
    if (!auth || !calendarId) {
      console.warn("Credenciales de Google no configuradas para freebusy.");
      return { success: true, availableSlots: standardSlots };
    }

    const calendar = google.calendar({ version: 'v3', auth });
    
    // Forzar la construcción exacta de las fechas con offset de Caracas (-04:00)
    // Usamos el formato estricto ISO 8601 para evitar confusiones de timezone en el servidor Node (UTC)
    const timeMinStr = `${dateString}T00:00:00-04:00`;
    const timeMaxStr = `${dateString}T23:59:59-04:00`;
    
    const startDate = new Date(timeMinStr);
    const endDate = new Date(timeMaxStr);

    console.log(`Consultando freebusy para ${calendarId} entre ${startDate.toISOString()} y ${endDate.toISOString()}`);

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone: 'America/Caracas',
        items: [{ id: calendarId }]
      }
    });

    const calendarData = response.data.calendars?.[calendarId];
    
    // Validar si Google devolvió un error específico para este calendario
    if (calendarData?.errors) {
      console.error("Error devuelto por la API de Google para este calendario:", calendarData.errors);
      // Si el calendario falla (ej. no está compartido), devolvemos todos los horarios temporalmente
      return { success: true, availableSlots: standardSlots };
    }

    const busyBlocks = calendarData?.busy || [];
    console.log(`Bloques ocupados devueltos por Google para el ${dateString}:`, JSON.stringify(busyBlocks));
    
    // Filtrar los horarios cruzándolos con los bloques ocupados
    const availableSlots = standardSlots.filter(slot => {
      // Crear objeto Date para el inicio y fin estricto en UTC-4
      const slotStartStr = `${dateString}T${slot}:00-04:00`;
      const slotStart = new Date(slotStartStr);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // +1 hora

      // Comprobar si el "slot" se solapa con algún bloque ocupado en Google Calendar
      const isBusy = busyBlocks.some(busy => {
        const busyStart = new Date(busy.start!);
        const busyEnd = new Date(busy.end!);
        // Hay solapamiento si: el slot empieza ANTES de que termine la ocupación
        // Y el slot termina DESPUÉS de que empiece la ocupación
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      return !isBusy;
    });

    console.log(`Horarios disponibles finalmente calculados:`, availableSlots);
    return { success: true, availableSlots };

  } catch (error: any) {
    console.error('Error FATAL consultando disponibilidad en Google Calendar:', error);
    console.log(error); // Solicitado: log explícito del error completo
    // Devuelve el mensaje exacto para que el frontend pueda pintar la caja roja de error y sepamos qué pasa
    const errMsg = error.message || error.toString();
    return { success: false, error: `Error de Google API: ${errMsg}` };
  }
}

// ─── Cancelar Cita ────────────────────────────────────────────────
export async function cancelBooking(citaId: string) {
  try {
    // 1. Obtener la cita de Supabase
    const { data: cita, error: dbError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', citaId)
      .single();

    if (dbError || !cita) {
      return { success: false, error: "No se encontró la cita en la base de datos." };
    }

    // 2. Eliminar de Google Calendar si tiene google_event_id
    if (cita.google_event_id) {
      try {
        const auth = getGoogleAuth();
        const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
        if (auth && calendarId) {
          const calendar = google.calendar({ version: 'v3', auth });
          await calendar.events.delete({
            calendarId: calendarId,
            eventId: cita.google_event_id,
          });
          console.log(`Evento ${cita.google_event_id} eliminado de Google Calendar.`);
        }
      } catch (calendarError) {
        console.error("No se pudo eliminar el evento de Google Calendar (puede que ya no exista):", calendarError);
        // Continuamos de todas formas para eliminar la cita de la DB local
      }
    }

    // 3. Eliminar la cita de Supabase
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', citaId);

    if (deleteError) {
      console.error("Error al eliminar de Supabase:", deleteError);
      return { success: false, error: "Error al eliminar la cita de la base de datos." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error general al cancelar la cita:", err);
    return { success: false, error: "Ocurrió un error inesperado al cancelar la cita." };
  }
}
