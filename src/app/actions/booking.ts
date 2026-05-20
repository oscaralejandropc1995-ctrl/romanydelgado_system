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
  
  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar.events']
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
export async function createBooking(data: {
  nombre: string;
  apellido: string;
  email: string;
  whatsapp: string;
  ciudad: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
}) {
  // 1. Validar datos con Zod
  const validation = bookingSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: firstError.message,
    };
  }

  // 2. Insertar en Supabase
  try {
    const { error } = await supabase
      .from('appointments')
      .insert([validation.data]);

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        success: false,
        errorCode: 'DB_ERROR',
        error: humanizeSupabaseError(error.code, error.message),
      };
    }

    // 3. Preparar formato de fechas para el correo
    const dateObj = new Date(validation.data.fecha_hora_inicio);
    const fechaFormatada = format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    const horaFormatada = format(dateObj, "HH:mm");

    // 4. Enviar correo de confirmación con Resend
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
          }),
        });
      } catch (emailError) {
        console.error('Error enviando el correo con Resend:', emailError);
        // No fallamos la operación completa si el correo falla
      }
    } else {
      console.warn("RESEND_API_KEY no configurada. El correo de confirmación no fue enviado.");
    }

    // 5. Crear Evento en Google Calendar
    try {
      const auth = getGoogleAuth();
      if (auth && process.env.GOOGLE_CALENDAR_ID) {
        const calendar = google.calendar({ version: 'v3', auth });
        
        await calendar.events.insert({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          requestBody: {
            summary: `Cita Legal: ${validation.data.nombre} ${validation.data.apellido}`,
            description: `Sede/Modalidad: ${validation.data.ciudad}\nCliente: ${validation.data.nombre} ${validation.data.apellido}\nEmail: ${validation.data.email}\nWhatsApp: ${validation.data.whatsapp}`,
            start: {
              dateTime: validation.data.fecha_hora_inicio,
              timeZone: 'America/Caracas', // Ajusta según la zona horaria real
            },
            end: {
              dateTime: validation.data.fecha_hora_fin,
              timeZone: 'America/Caracas',
            },
          },
        });
      } else {
        console.warn('Credenciales de Google Calendar incompletas o no configuradas.');
      }
    } catch (calendarError) {
      console.error('Error al crear evento en Google Calendar:', calendarError);
      // No fallamos si el calendario falla, la cita ya está en Supabase.
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
