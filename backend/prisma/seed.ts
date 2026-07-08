import { prisma } from "../src/db/prisma.js";

const categories = [
  {
    name: "IT",
    slug: "it",
    description: "General IT support requests.",
  },
  {
    name: "HR",
    slug: "hr",
    description: "Human resources related requests.",
  },
  {
    name: "Finance",
    slug: "finance",
    description: "Finance, billing, invoice, and payment related requests.",
  },
  {
    name: "Access Request",
    slug: "access-request",
    description: "Requests for system, application, or resource access.",
  },
  {
    name: "Hardware",
    slug: "hardware",
    description: "Laptop, desktop, printer, phone, or other hardware issues.",
  },
  {
    name: "Software",
    slug: "software",
    description: "Software installation, bugs, licenses, or configuration.",
  },
  {
    name: "Network",
    slug: "network",
    description: "Internet, Wi-Fi, VPN, DNS, or connectivity issues.",
  },
  {
    name: "Other",
    slug: "other",
    description: "Requests that do not fit another category.",
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
    });
  }

  console.log("Seeded initial ticket categories.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
