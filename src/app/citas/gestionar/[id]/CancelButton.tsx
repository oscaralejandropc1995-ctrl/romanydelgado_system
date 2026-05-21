'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cancelBooking } from '@/app/actions/booking';
import { Loader2, Trash2 } from 'lucide-react';

export default function CancelButton({ citaId }: { citaId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCancel = async () => {
    const confirmCancel = window.confirm(
      "¿Está seguro de que desea cancelar esta cita? Esta acción no se puede deshacer y el horario quedará liberado."
    );

    if (!confirmCancel) return;

    setIsLoading(true);
    setError(null);

    const result = await cancelBooking(citaId);

    if (result.success) {
      alert("Su cita ha sido cancelada exitosamente.");
      router.push('/');
    } else {
      setError(result.error || "No se pudo cancelar la cita. Intente nuevamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-200 text-sm">
          {error}
        </div>
      )}
      <Button 
        onClick={handleCancel} 
        disabled={isLoading}
        variant="destructive"
        className="w-full sm:w-auto self-start h-12 px-8 font-medium bg-red-900 hover:bg-red-800 text-white rounded-none border border-red-800 transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Cancelando cita...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4 mr-2" />
            Cancelar Cita Definitivamente
          </>
        )}
      </Button>
    </div>
  );
}
