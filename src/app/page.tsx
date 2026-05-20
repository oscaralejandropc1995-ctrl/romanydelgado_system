import BookingForm from "@/components/BookingForm";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#0a0a0a]">
      
      {/* LEFT SIDE: Light Premium Branding (Perfect for black text logo) */}
      <div className="w-full lg:w-5/12 bg-[#fdfbf7] flex flex-col justify-center items-center p-8 lg:p-16 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#cba258]/30">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#cba258]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#cba258]/10 rounded-full blur-3xl"></div>

        <div className="z-10 flex flex-col items-center max-w-md text-center">
          {/* LOGO */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 drop-shadow-xl hover:scale-105 transition-transform duration-700">
            <Image 
              src="/logo.png" 
              alt="Logo Román & Delgado" 
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <div className="space-y-6">
            <div className="h-[1px] w-24 bg-[#cba258] mx-auto"></div>
            <p className="text-zinc-600 text-lg md:text-xl leading-relaxed font-light tracking-wide">
              Excelencia, discreción y resultados. Agende su consulta legal con nuestro equipo de expertos y asegure su tranquilidad.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Dark Form Section */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center items-center p-4 py-12 lg:p-12 xl:p-20 relative">
        {/* Background dark gradients */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#cba258]/10 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="w-full max-w-2xl relative z-10">
          <div className="mb-10 lg:mb-12 text-center lg:text-left">
            <h2 className="text-[#cba258] text-sm uppercase tracking-[0.3em] font-semibold mb-3">Portal de Clientes</h2>
            <h1 className="text-3xl md:text-4xl font-heading text-white">Reserva en Línea</h1>
          </div>

          <div className="bg-[#111111] p-6 sm:p-10 rounded-none shadow-2xl border border-zinc-800/80 relative backdrop-blur-sm">
            {/* Golden top border accent */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#cba258] to-transparent"></div>
            <BookingForm />
          </div>
        </div>
      </div>
      
    </main>
  );
}
