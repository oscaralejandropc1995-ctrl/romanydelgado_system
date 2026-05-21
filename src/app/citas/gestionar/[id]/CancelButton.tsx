'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cancelBooking } from '@/app/actions/booking';
import { Loader2, Trash2, AlertTriangle, CheckCircle2, CalendarPlus } from 'lucide-react';

export default function CancelButton({ citaId }: { citaId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<'cancel' | 'reschedule' | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);

    const result = await cancelBooking(citaId);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2500); // Redirige después de 2.5s
    } else {
      setError(result.error || "No se pudo cancelar la cita. Intente nuevamente.");
      setIsLoading(false);
      setConfirmingAction(null);
    }
  };

  if (isSuccess) {
    const successMsg = confirmingAction === 'reschedule' 
      ? "Cita anulada. Preparando nueva reservación..." 
      : "Cita cancelada exitosamente";

    return (
      <div className="flex flex-col items-center justify-center p-6 bg-green-950/30 border border-green-900/50 rounded-sm animate-in fade-in zoom-in duration-500">
        <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
        <p className="text-green-400 font-medium text-center">{successMsg}</p>
        <p className="text-green-500/70 text-sm mt-1 text-center">Redirigiendo al inicio...</p>
      </div>
    );
  }

  if (confirmingAction) {
    const isReschedule = confirmingAction === 'reschedule';
    
    return (
      <div className="flex flex-col gap-4 p-5 bg-[#1a1410] border border-[#cba258]/30 rounded-sm animate-in slide-in-from-bottom-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isReschedule ? 'text-[#cba258]' : 'text-red-500'}`} />
          <div>
            <p className="text-white font-medium mb-1">
              {isReschedule ? "¿Reprogramar Cita?" : "¿Está seguro?"}
            </p>
            <p className="text-sm text-zinc-400">
              {isReschedule 
                ? "Deseas cancelar esta cita actual para liberar el espacio y seleccionar una nueva fecha en el inicio." 
                : "Esta acción no se puede deshacer y el horario quedará liberado inmediatamente."}
            </p>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-900/50 text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button 
            onClick={handleCancel} 
            disabled={isLoading}
            variant={isReschedule ? "default" : "destructive"}
            className={`flex-1 h-11 text-white rounded-none border transition-colors ${
              isReschedule 
                ? "bg-[#cba258] hover:bg-[#b08d4a] border-[#cba258] text-black font-semibold" 
                : "bg-red-900 hover:bg-red-800 border-red-800"
            }`}
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
            ) : (
              isReschedule ? "Sí, cancelar e ir al inicio" : "Sí, cancelar cita"
            )}
          </Button>
          <Button 
            onClick={() => setConfirmingAction(null)} 
            disabled={isLoading}
            variant="outline"
            className="flex-1 h-11 bg-transparent hover:bg-zinc-800 text-zinc-300 rounded-none border border-zinc-700"
          >
            Atrás
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button 
        onClick={() => setConfirmingAction('reschedule')} 
        variant="outline"
        className="flex-1 h-12 font-medium bg-[#141414] hover:bg-[#1f1a14] text-[#cba258] hover:text-[#e0b976] rounded-none border border-[#cba258]/30 hover:border-[#cba258] transition-all"
      >
        <CalendarPlus className="w-4 h-4 mr-2" />
        Reprogramar Cita
      </Button>
      <Button 
        onClick={() => setConfirmingAction('cancel')} 
        variant="destructive"
        className="flex-1 h-12 font-medium bg-[#1a0f0f] hover:bg-red-950 text-red-400 hover:text-red-300 rounded-none border border-red-900/30 hover:border-red-800 transition-all"
      >
        <Trash2 className="w-4 h-4 mr-2 opacity-70" />
        Cancelar Definitivo
      </Button>
    </div>
  );
}
