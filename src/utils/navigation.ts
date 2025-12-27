// An array of links for navigation bar
import { getRelativeUrl } from "./utils";

const navBarLinks = [
  { name: "Home", url: getRelativeUrl("/") },
  { name: "About", url: getRelativeUrl("about") },
  { name: "Services", url: getRelativeUrl("services") },
  { name: "Blog", url: getRelativeUrl("blog") },
  { name: "Contact", url: getRelativeUrl("contact") },
];
// An array of links for footer
const footerLinks = [
  {
    section: "Services",
    links: [
      { name: "Documentation", url: getRelativeUrl("welcome-to-docs/") },
      { name: "Data Engineering", url: getRelativeUrl("services") },
      { name: "Analytics Consulting", url: getRelativeUrl("services") },
    ],
  },
  {
    section: "Company",
    links: [
      { name: "About us", url: getRelativeUrl("about") },
      { name: "Blog", url: getRelativeUrl("blog") },
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