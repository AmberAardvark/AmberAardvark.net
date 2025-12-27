
import { getRelativeUrl } from "../utils";

const navBarLinks = [
  { name: "Accueil", url: getRelativeUrl("fr") },
  { name: "Services", url: getRelativeUrl("fr/services") },
  { name: "Blog", url: getRelativeUrl("fr/blog") },
  { name: "Contact", url: getRelativeUrl("fr/contact") },
];

const footerLinks = [
  {
    section: "Écosystème",
    links: [
      { name: "Documentation", url: getRelativeUrl("fr/welcome-to-docs/") },
      { name: "Ingénierie des Données", url: getRelativeUrl("fr/services#data-engineering") },
      { name: "Conseil en Analytique", url: getRelativeUrl("fr/services#analytics-consulting") },
      { name: "Formation", url: getRelativeUrl("fr/services#training") },
    ],
  },
  {
    section: "Société",
    links: [
      { name: "À propos de nous", url: "#" },
      { name: "Blog", url: getRelativeUrl("fr/blog") },
      { name: "Contact", url: getRelativeUrl("fr/contact") },
    ],
  },
];

const socialLinks = {
  facebook: "#",
  github: "https://github.com/mearashadowfax/AmberAardvark.net",
  google: "#",
  slack: "#",
};

export default {
  navBarLinks,
  footerLinks,
  socialLinks,
};