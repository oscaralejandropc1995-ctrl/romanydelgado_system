"use client";

import React, { useState } from "react";
import { format, isBefore, startOfDay, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, CheckCircle2, Clock, MapPin, User, Mail, Phone, FileText, UploadCloud } from "lucide-react";
import { createBooking, getAvailableTimeSlots } from "@/app/actions/booking";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type City = "Valencia" | "Caracas" | "La Guaira" | "Tucacas" | "Virtual" | "";



export default function BookingForm() {
  const [city, setCity] = useState<City>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    whatsapp: "",
  });
  const [documento, setDocumento] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const isDayDisabled = (dateToCheck: Date) => {
    if (isBefore(startOfDay(dateToCheck), startOfDay(new Date()))) {
      return true;
    }
    const day = getDay(dateToCheck);
    if (day === 0 || day === 6) return true;
    if (!city) return true;

    switch (city) {
      case "Valencia": return day !== 1 && day !== 5;
      case "Caracas": return day !== 2 && day !== 4;
      case "La Guaira": return day !== 3;
      case "Tucacas": return day !== 5;
      case "Virtual": return false;
      default: return true;
    }
  };

  const handleCityChange = (value: string | null) => {
    if (value) {
      setCity(value as City);
    } else {
      setCity("");
    }
    setDate(undefined);
    setTime("");
    setErrorMessage(null);
    setSlotsError(null);
  };

  const handleDateSelect = async (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setTime(""); // Resetear hora si cambia el día
    setSlotsError(null);
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    setIsCalendarOpen(false);
    setIsLoadingSlots(true);
    setErrorMessage(null);
    
    // Consultar disponibilidad en tiempo real
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const response = await getAvailableTimeSlots(formattedDate);
    
    if (response.success && response.availableSlots) {
      setAvailableSlots(response.availableSlots);
    } else {
      setSlotsError(response.error || "Error al cargar la disponibilidad.");
      setAvailableSlots([]);
    }
    
    setIsLoadingSlots(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Validar Nombre y Apellido: Solo letras y espacios
    if (name === "nombre" || name === "apellido") {
      formattedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    }
    
    // Validar WhatsApp: Solo números y símbolos de teléfono (+ - paréntesis espacios)
    if (name === "whatsapp") {
      formattedValue = value.replace(/[^\d\s\+\-\(\)]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!city || !date || !time || !formData.nombre || !formData.apellido || !formData.email || !formData.whatsapp) {
      setErrorMessage("Por favor complete todos los campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(hours + 1, minutes, 0, 0);

      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('apellido', formData.apellido);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('whatsapp', formData.whatsapp);
      formDataToSend.append('ciudad', city);
      formDataToSend.append('fecha_hora_inicio', startDate.toISOString());
      formDataToSend.append('fecha_hora_fin', endDate.toISOString());
      
      if (city === "Virtual" && documento) {
        formDataToSend.append('documento', documento);
      }
      
      const response = await createBooking(formDataToSend);
      
      if (response.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(response.error || "Ocurrió un error inesperado al agendar la cita.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error de conexión. Verifique su internet e intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center animate-in fade-in zoom-in duration-700">
        <div className="h-24 w-24 rounded-full border-2 border-[#cba258] flex items-center justify-center mb-2 bg-[#cba258]/10 shadow-[0_0_30px_rgba(203,162,88,0.2)]">
          <CheckCircle2 className="h-12 w-12 text-[#cba258]" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-heading font-medium text-white">Cita Confirmada</h2>
        <p className="text-zinc-400 max-w-md font-light leading-relaxed">
          Su espacio ha sido reservado con éxito. Se ha enviado un correo electrónico de confirmación con los detalles.
        </p>
        <Button 
          type="button"
          onClick={() => {
            setIsSuccess(false);
            setCity("");
            setDate(undefined);
            setTime("");
            setFormData({ nombre: "", apellido: "", email: "", whatsapp: "" });
            setDocumento(null);
          }}
          className="mt-6 rounded-none bg-transparent text-[#cba258] border border-[#cba258] hover:bg-[#cba258] hover:text-black transition-all duration-300 h-12 px-8 font-medium tracking-wide"
        >
          Agendar Nueva Cita
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Modalidad / Ciudad */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <MapPin className="w-4 h-4 text-[#cba258]" />
          1. Seleccione la Sede o Modalidad
        </Label>
        <Select value={city} onValueChange={handleCityChange}>
          <SelectTrigger className="w-full bg-[#0a0a0a] text-white rounded-none h-12 border-zinc-800 focus:ring-[#cba258] focus:border-[#cba258] transition-all">
            <SelectValue placeholder="Elegir modalidad..." />
          </SelectTrigger>
          <SelectContent className="bg-[#141414] border-zinc-800 text-zinc-300 rounded-none shadow-2xl">
            <SelectItem value="Valencia" className="focus:bg-[#cba258] focus:text-black cursor-pointer">Valencia (Lunes y Viernes)</SelectItem>
            <SelectItem value="Caracas" className="focus:bg-[#cba258] focus:text-black cursor-pointer">Caracas (Martes y Jueves)</SelectItem>
            <SelectItem value="La Guaira" className="focus:bg-[#cba258] focus:text-black cursor-pointer">La Guaira (Miércoles)</SelectItem>
            <SelectItem value="Tucacas" className="focus:bg-[#cba258] focus:text-black cursor-pointer">Tucacas (Viernes)</SelectItem>
            <SelectItem value="Virtual" className="focus:bg-[#cba258] focus:text-black cursor-pointer">Virtual (Lunes a Viernes)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 2. Fecha */}
      <div className={cn("space-y-3 transition-opacity duration-300", !city ? "opacity-30 pointer-events-none" : "opacity-100")}>
        <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <CalendarIcon className="w-4 h-4 text-[#cba258]" />
          2. Seleccione la Fecha
        </Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger
            className={cn(
              "flex w-full items-center justify-start text-left font-normal h-12 px-4 bg-[#0a0a0a] text-white border border-zinc-800 transition-all hover:border-[#cba258]/50 focus:ring-1 focus:ring-[#cba258]",
              !date && "text-zinc-500"
            )}
          >
            <CalendarIcon className="mr-3 h-4 w-4 text-[#cba258]" />
            {date ? format(date, "PPP", { locale: es }) : <span>Elegir fecha...</span>}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#141414] border-zinc-800 shadow-2xl rounded-none" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={isDayDisabled}
              className="text-white"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 3. Hora */}
      <div className={cn("space-y-3 transition-opacity duration-300", !date ? "opacity-30 pointer-events-none" : "opacity-100")}>
        <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Clock className="w-4 h-4 text-[#cba258]" />
          3. Seleccione la Hora
        </Label>
        {isLoadingSlots ? (
          <div className="flex items-center gap-3 text-zinc-400 py-4 animate-in fade-in">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-[#cba258] rounded-full animate-spin" />
            <span className="text-sm">Consultando disponibilidad en tiempo real...</span>
          </div>
        ) : slotsError ? (
          <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-200 text-sm animate-in fade-in">
            {slotsError}
          </div>
        ) : availableSlots.length === 0 && date ? (
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-sm animate-in fade-in">
            Lo sentimos, no hay horarios disponibles para esta fecha. Por favor seleccione otro día.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-2">
            {availableSlots.map((slot) => (
              <Button
                key={slot}
                type="button"
                variant={time === slot ? "default" : "outline"}
                className={cn(
                  "h-11 transition-all rounded-none font-medium",
                  time === slot 
                    ? "bg-[#cba258] text-black hover:bg-[#d4b06a] border-[#cba258]" 
                    : "bg-[#0a0a0a] text-zinc-400 border-zinc-800 hover:border-[#cba258]/50 hover:text-[#cba258]"
                )}
                onClick={() => setTime(slot)}
              >
                {slot}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Datos del Cliente */}
      <div className={cn("space-y-6 pt-4 border-t border-zinc-800/50 transition-opacity duration-300", !time ? "opacity-30 pointer-events-none" : "opacity-100")}>
        <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <User className="w-4 h-4 text-[#cba258]" />
          4. Información del Cliente
        </Label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-xs text-zinc-500 uppercase tracking-wider">Nombre</Label>
            <Input 
              id="nombre" name="nombre" 
              placeholder="Su nombre" 
              className="h-12 bg-[#0a0a0a] text-white border-zinc-800 rounded-none focus-visible:ring-[#cba258] focus-visible:border-[#cba258]"
              value={formData.nombre} onChange={handleInputChange} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido" className="text-xs text-zinc-500 uppercase tracking-wider">Apellido</Label>
            <Input 
              id="apellido" name="apellido" 
              placeholder="Su apellido" 
              className="h-12 bg-[#0a0a0a] text-white border-zinc-800 rounded-none focus-visible:ring-[#cba258] focus-visible:border-[#cba258]"
              value={formData.apellido} onChange={handleInputChange} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider">
              <Mail className="w-3 h-3 text-[#cba258]" /> Correo Electrónico
            </Label>
            <Input 
              id="email" name="email" type="email"
              placeholder="correo@ejemplo.com" 
              className="h-12 bg-[#0a0a0a] text-white border-zinc-800 rounded-none focus-visible:ring-[#cba258] focus-visible:border-[#cba258]"
              value={formData.email} onChange={handleInputChange} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider">
              <Phone className="w-3 h-3 text-[#cba258]" /> WhatsApp
            </Label>
            <Input 
              id="whatsapp" name="whatsapp" type="tel"
              placeholder="+58 412 1234567" 
              className="h-12 bg-[#0a0a0a] text-white border-zinc-800 rounded-none focus-visible:ring-[#cba258] focus-visible:border-[#cba258]"
              value={formData.whatsapp} onChange={handleInputChange} 
            />
          </div>
        </div>
      </div>

      {/* 5. Documentos de Caso (Solo Virtual) */}
      {city === "Virtual" && (
        <div className={cn("space-y-4 pt-4 border-t border-zinc-800 transition-opacity duration-300", !time ? "opacity-30 pointer-events-none" : "opacity-100")}>
          <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <FileText className="w-4 h-4 text-[#cba258]" />
            5. Documentación del Caso (Opcional)
          </Label>
          <div className="relative group cursor-pointer">
            <input 
              type="file" 
              accept=".pdf"
              onChange={(e) => setDocumento(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              aria-label="Subir documento PDF"
            />
            <div className={`flex flex-col items-center justify-center border-2 border-dashed p-6 rounded-sm transition-all bg-[#0a0a0a] ${documento ? 'border-[#cba258] bg-[#cba258]/5' : 'border-zinc-800 group-hover:border-zinc-600'}`}>
              {documento ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-[#cba258] mb-2" />
                  <p className="text-white text-sm font-medium">{documento.name}</p>
                  <p className="text-xs text-[#cba258] mt-1">{(documento.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-zinc-600 mb-2 group-hover:text-[#cba258] transition-colors" />
                  <p className="text-zinc-400 text-sm">Haga clic o arrastre su documento en formato PDF</p>
                  <p className="text-zinc-600 text-xs mt-1">Máximo 5MB</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-950/50 border border-red-900/50 rounded-none text-red-200 text-sm animate-in fade-in slide-in-from-bottom-2">
          {errorMessage}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isSubmitting || !time || !formData.nombre || !formData.apellido || !formData.email || !formData.whatsapp}
        className="w-full h-14 mt-4 text-base font-semibold rounded-none bg-[#cba258] text-black hover:bg-[#b58e47] transition-all duration-300 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Procesando...
          </div>
        ) : (
          "AGENDAR CONSULTA"
        )}
      </Button>
    </form>
  );
}
