import BookingForm from "@/components/BookingForm";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background elegant gradient/effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#cba258]/10 via-[#0a0a0a] to-[#0a0a0a] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#cba258]/5 via-transparent to-transparent -z-10"></div>
      
      <div className="z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Branding */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-8 pt-10">
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-2">
            <Image 
              src="/logo.png" 
              alt="Logo Román & Delgado" 
              fill
              className="object-contain"
              priority
            />
          </div>
          
          {/* Si tu imagen ya trae el texto (Román & Delgado - Despacho de abogados), 
              puedes dejar esto comentado. Si la imagen es solo la balanza, descoméntalo.
          <div>
            <h1 className="font-heading text-5xl md:text-6xl font-medium text-white tracking-tight mb-2">
              Román &<br />
              <span className="text-[#cba258] italic">Delgado</span>
            </h1>
            <h2 className="text-sm md:text-base text-zinc-400 uppercase tracking-[0.2em] font-semibold mt-4">
              Despacho de Abogados
            </h2>
          </div>
          */}
          
          <div className="space-y-6">
            <p className="text-zinc-300 text-lg leading-relaxed font-light">
              Excelencia, discreción y resultados. Agende su consulta legal con nuestro equipo de expertos y asegure su tranquilidad.
            </p>
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-[#cba258]"></div>
              <p className="text-xs text-[#cba258] uppercase tracking-widest font-semibold">Reserva en línea</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 bg-[#141414] p-6 sm:p-10 rounded-2xl shadow-2xl border border-zinc-800 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-[#cba258] to-transparent"></div>
          <BookingForm />
        </div>
      </div>
    </main>
  );
}
