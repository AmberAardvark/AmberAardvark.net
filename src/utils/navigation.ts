// An array of links for navigation bar
import { getRelativeUrl } from "./utils";

function route(path: string, locale: "en" | "es" = "en"): string {
  const localizedPath = locale === "es" ? `es/${path}` : path;
  return getRelativeUrl(localizedPath);
}

const navBarLinks = [
  { name: "Home", url: route("") },
  { name: "About", url: route("about") },
  { name: "Services", url: route("services") },
  { name: "Accelerators", url: route("products") },
  { name: "Contact", url: route("contact") },
];
// An array of links for footer
const footerLinks = [
  {
    section: "Services",
    links: [
      {
        name: "Data Analytics",
        url: getRelativeUrl("services#data-analytics"),
      },
      {
        name: "Process Automation",
        url: getRelativeUrl("services#process-automation"),
      },
      {
        name: "Custom Apps",
        url: getRelativeUrl("services#custom-app-development"),
      },
      {
        name: "Agentic Workflows",
        url: getRelativeUrl("services#agentic-workflows"),
      },
    ],
  },
  {
    section: "Accelerators",
    url: getRelativeUrl("products"),
    links: [
      {
        name: "Data Lake Accelerator",
        url: getRelativeUrl("products/data-lake-accelerator"),
      },
      {
        name: "Power BI Audit Tool",
        url: getRelativeUrl("products/power-bi-audit-tool"),
      },
      {
        name: "Azure Cost Optimizer",
        url: getRelativeUrl("products/azure-cost-optimizer"),
      },
      {
        name: "Data Quality Framework",
        url: getRelativeUrl("products/data-quality-framework"),
      },
      {
        name: "Sovereign Data Platform",
        url: getRelativeUrl("products/numbat"),
      },
    ],
  },
  {
    section: "Company",
    links: [
      { name: "About us", url: getRelativeUrl("about") },
      { name: "Contact", url: getRelativeUrl("contact") },
    ],
  },
];
// An object of links for social icons
const socialLinks = {
  facebook: "https://www.facebook.com/",
  github: "https://github.com/AmberAardvark/AmberAardvark.net",
  google: "https://www.google.com/",
  slack: "https://slack.com/",
};

export default {
  navBarLinks,
  footerLinks,
  socialLinks,
};

export function getNavigation(locale: "en" | "es" = "en") {
  if (locale === "en") {
    return {
      navBarLinks,
      footerLinks,
      socialLinks,
      newsletterTitle: "Stay up to date",
      newsletterContent:
        "Stay updated with the latest insights and exclusive offers.",
      newsletterLabel: "Search",
      newsletterButton: "Subscribe",
      newsletterPlaceholder: "Enter your email",
      copyright: "All rights reserved.",
    };
  }

  return {
    navBarLinks: [
      { name: "Inicio", url: route("", "es") },
      { name: "Nosotros", url: route("about", "es") },
      { name: "Servicios", url: route("services", "es") },
      { name: "Aceleradores", url: route("products", "es") },
      { name: "Contacto", url: route("contact", "es") },
    ],
    footerLinks: [
      {
        section: "Servicios",
        links: [
          {
            name: "Análisis de datos",
            url: route("services#data-analytics", "es"),
          },
          {
            name: "Automatización de procesos",
            url: route("services#process-automation", "es"),
          },
          {
            name: "Aplicaciones personalizadas",
            url: route("services#custom-app-development", "es"),
          },
          {
            name: "Flujos agénticos",
            url: route("services#agentic-workflows", "es"),
          },
        ],
      },
      {
        section: "Aceleradores",
        url: route("products", "es"),
        links: [
          {
            name: "Acelerador de lago de datos",
            url: route("products/data-lake-accelerator"),
          },
          {
            name: "Herramienta de auditoría de Power BI",
            url: route("products/power-bi-audit-tool"),
          },
          {
            name: "Optimizador de costos de Azure",
            url: route("products/azure-cost-optimizer"),
          },
          {
            name: "Marco de calidad de datos",
            url: route("products/data-quality-framework"),
          },
          {
            name: "Plataforma de datos soberana",
            url: route("products/numbat"),
          },
        ],
      },
      {
        section: "Empresa",
        links: [
          { name: "Nosotros", url: route("about", "es") },
          { name: "Contacto", url: route("contact", "es") },
        ],
      },
    ],
    socialLinks,
    newsletterTitle: "Mantente al día",
    newsletterContent:
      "Recibe las últimas ideas y novedades cuando estén disponibles.",
    newsletterLabel: "Buscar",
    newsletterButton: "Suscribirme",
    newsletterPlaceholder: "Ingresa tu correo",
    copyright: "Todos los derechos reservados.",
  };
}
