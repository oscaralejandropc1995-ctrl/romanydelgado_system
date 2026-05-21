import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Link,
} from "@react-email/components";
import * as React from "react";

interface BookingConfirmationProps {
  nombre: string;
  ciudad: string;
  fecha: string;
  hora: string;
  citaId?: string; // ID for management links
}

export default function BookingConfirmation({
  nombre,
  ciudad,
  fecha,
  hora,
  citaId = "ejemplo-id", // Fallback for previews
}: BookingConfirmationProps) {
  
  const isVirtual = ciudad.toLowerCase() === "virtual";
  const mapUrl = isVirtual 
    ? null 
    : `https://maps.google.com/?q=Sede+${encodeURIComponent(ciudad)}+Abogados`;

  const manageUrl = `https://tudominio.com/citas/gestionar/${citaId}`;

  return (
    <Html>
      <Head />
      <Preview>Confirmación de su cita en Román & Delgado</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Heading style={h1}>Román & Delgado</Heading>
            <Text style={subtitle}>Despacho de Abogados</Text>
          </Section>
          <Hr style={hr} />
          
          <Text style={text}>Estimado/a {nombre},</Text>
          <Text style={text}>
            Su cita ha sido agendada con éxito. A continuación, le presentamos un
            resumen de los detalles de su reservación:
          </Text>
          
          <Section style={detailsContainer}>
            <Text style={detailText}><strong>Modalidad/Sede:</strong> {ciudad}</Text>
            <Text style={detailText}><strong>Fecha:</strong> {fecha}</Text>
            <Text style={detailText}><strong>Hora:</strong> {hora}</Text>
            
            {!isVirtual && mapUrl && (
              <Section style={buttonContainer}>
                <Button style={mapButton} href={mapUrl}>
                  Ver ubicación en el mapa
                </Button>
              </Section>
            )}
          </Section>
          
          <Section style={manageContainer}>
            <Text style={text}>¿Necesita realizar un cambio?</Text>
            <Link href={manageUrl} style={manageLink}>
              Reprogramar o Cancelar Cita
            </Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Por favor, intente llegar o conectarse con 10 minutos de anticipación.
            Si necesita cancelar o reprogramar, contáctenos con al menos 24 horas de antelación.
          </Text>
          <Text style={footer}>© {new Date().getFullYear()} Román & Delgado. Todos los derechos reservados.</Text>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos en línea (Inline CSS) obligatorios para emails
const main = {
  backgroundColor: "#0a0a0a", // Dark background outside email
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "40px 0",
};
const container = {
  backgroundColor: "#141414", // Dark container
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "0px",
  border: "1px solid #333",
  borderTop: "4px solid #cba258", // Gold accent
  maxWidth: "600px",
};
const logoContainer = {
  textAlign: "center" as const,
  paddingBottom: "10px",
};
const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "300",
  textAlign: "center" as const,
  margin: "0",
  fontFamily: "Georgia, serif", // Elegance
};
const subtitle = {
  color: "#cba258",
  fontSize: "14px",
  textTransform: "uppercase" as const,
  letterSpacing: "2px",
  textAlign: "center" as const,
  marginTop: "8px",
  marginBottom: "10px",
};
const text = {
  color: "#e2e8f0",
  fontSize: "16px",
  lineHeight: "24px",
  fontWeight: "300",
};
const detailsContainer = {
  backgroundColor: "#0a0a0a",
  padding: "24px",
  borderLeft: "2px solid #cba258",
  margin: "24px 0",
};
const detailText = {
  color: "#ffffff",
  fontSize: "16px",
  margin: "8px 0",
  fontWeight: "300",
};
const buttonContainer = {
  marginTop: "20px",
};
const mapButton = {
  backgroundColor: "#cba258",
  color: "#000000",
  padding: "12px 20px",
  borderRadius: "2px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
  display: "inline-block",
  textAlign: "center" as const,
};
const manageContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "16px",
  padding: "20px",
  backgroundColor: "#1a1a1a",
};
const manageLink = {
  color: "#cba258",
  textDecoration: "underline",
  fontSize: "15px",
  fontWeight: "500",
  display: "inline-block",
  marginTop: "8px",
};
const hr = {
  borderColor: "#333",
  margin: "24px 0",
};
const footer = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "22px",
  textAlign: "center" as const,
  fontWeight: "300",
};
