import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import CancelButton from './CancelButton';

export default async function GestionarCitaPage({ params }: { params: { id: string } }) {
  const citaId = params.id;

  // 1. Obtener los detalles de la cita desde Supabase
  const { data: cita, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', citaId)
    .single();

  if (error || !cita) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#141414] p-8 border-t-4 border-red-900 shadow-2xl text-center">
          <AlertCircle className="w-16 h-16 text-red-900 mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-white mb-2">Cita No Encontrada</h1>
          <p className="text-zinc-400 mb-6">
            Lo sentimos, no hemos podido encontrar esta cita en nuestro sistema. Es posible que ya haya sido cancelada o que el enlace sea incorrecto.
          </p>
          <a href="/" className="text-[#cba258] hover:text-[#d4b06a] transition-colors underline underline-offset-4">
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  const dateObj = new Date(cita.fecha_hora_inicio);
  const fechaStr = format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const horaStr = format(dateObj, "hh:mm a");

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#cba258]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#cba258]/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-xl w-full relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif text-white mb-2 tracking-wide">Gestión de Cita</h1>
          <div className="w-16 h-0.5 bg-[#cba258] mx-auto opacity-50 mb-4" />
          <p className="text-zinc-400">Verifique los detalles de su cita a continuación.</p>
        </div>

        <div className="bg-[#141414] border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="p-8">
            <h2 className="text-xl text-[#cba258] font-medium mb-6">Resumen de la Reservación</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-[#cba258]/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-[#cba258]" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Cliente</p>
                  <p className="text-white font-medium">{cita.nombre} {cita.apellido}</p>
                  <p className="text-sm text-zinc-400">{cita.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-[#cba258]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[#cba258]" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Fecha Programada</p>
                  <p className="text-white font-medium capitalize">{fechaStr}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-[#cba258]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#cba258]" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Hora</p>
                  <p className="text-white font-medium">{horaStr}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-[#cba258]/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#cba258]" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Sede / Modalidad</p>
                  <p className="text-white font-medium">{cita.ciudad}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#0f0f0f] border-t border-zinc-800">
            <div className="mb-6">
              <p className="text-sm text-zinc-400">
                Si no puede asistir, le agradecemos que cancele su cita para liberar el espacio para otro cliente. Al cancelar, esta acción no se puede deshacer.
              </p>
            </div>
            
            <CancelButton citaId={citaId} />
            
          </div>
        </div>
      </div>
    </main>
  );
}
