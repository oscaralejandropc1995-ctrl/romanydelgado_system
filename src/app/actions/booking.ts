'use server'

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import BookingConfirmation from '@/components/emails/BookingConfirmation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function createBooking(data: {
  nombre: string;
  apellido: string;
  email: string;
  whatsapp: string;
  ciudad: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
}) {
  try {
    const { error } = await supabase
      .from('appointments')
      .insert([data]);

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error: error.message };
    }

    // Preparar formato de fechas para el correo
    const dateObj = new Date(data.fecha_hora_inicio);
    const fechaFormatada = format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    const horaFormatada = format(dateObj, "HH:mm");

    // Enviar correo de confirmación con Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
            from: 'Román & Delgado <onboarding@resend.dev>', // Cambia esto por tu dominio verificado en Resend
          to: [data.email],
          subject: 'Confirmación de su cita - Román & Delgado',
          react: React.createElement(BookingConfirmation, {
            nombre: `${data.nombre} ${data.apellido}`,
            ciudad: data.ciudad,
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

    return { success: true };
  } catch (err: any) {
    console.error('Server action error:', err);
    return { success: false, error: err.message || 'Error desconocido' };
  }
}
