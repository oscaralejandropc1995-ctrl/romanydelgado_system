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
  Img,
} from "@react-email/components";
import * as React from "react";

interface BookingConfirmationProps {
  nombre: string;
  ciudad: string;
  fecha: string;
  hora: string;
}

export default function BookingConfirmation({
  nombre,
  ciudad,
  fecha,
  hora,
}: BookingConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirmación de su cita en Román & Delgado</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Placeholder - You can change the src to a public URL of your logo */}
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
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
  maxWidth: "600px",
};
const logoContainer = {
  textAlign: "center" as const,
  paddingBottom: "10px",
};
const h1 = {
  color: "#1e293b",
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0",
};
const subtitle = {
  color: "#64748b",
  fontSize: "16px",
  textAlign: "center" as const,
  marginTop: "4px",
  marginBottom: "10px",
};
const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
};
const detailsContainer = {
  backgroundColor: "#f8fafc",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  borderLeft: "4px solid #2563eb",
};
const detailText = {
  color: "#1e293b",
  fontSize: "16px",
  margin: "8px 0",
};
const hr = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};
const footer = {
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign: "center" as const,
};
