// An array of links for navigation bar
import { getRelativeUrl } from "./utils";

const navBarLinks = [
  { name: "Home", url: getRelativeUrl("/") },
  { name: "About", url: getRelativeUrl("about") },
  { name: "Services", url: getRelativeUrl("services") },
  { name: "Accelerators", url: getRelativeUrl("products") },
  { name: "Blog", url: getRelativeUrl("blog") },
  { name: "Contact", url: getRelativeUrl("contact") },
];
// An array of links for footer
const footerLinks = [
  {
    section: "Services",
    links: [
      { name: "Data Analytics", url: getRelativeUrl("services#data-analytics") },
      { name: "Process Automation", url: getRelativeUrl("services#process-automation") },
      { name: "Custom Apps", url: getRelativeUrl("services#custom-app-development") },
      { name: "Agentic Workflows", url: getRelativeUrl("services#agentic-workflows") },
    ],
  },
  {
    section: "Accelerators",
    links: [
      { name: "All Accelerators", url: getRelativeUrl("products") },
      { name: "Numbat Data Platform", url: getRelativeUrl("products/item-numbat") },
    ],
  },
  {
    section: "Company",
    links: [
      { name: "About us", url: getRelativeUrl("about") },
      { name: "Blog", url: getRelativeUrl("blog") },
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