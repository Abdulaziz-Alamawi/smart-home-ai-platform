import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Smart Home AI Platform API",
      version: "1.0.0",
      description:
        "Production-grade REST API for managing smart-home devices, automation, " +
        "energy analytics and AI-driven recommendations.",
      contact: { name: "Abdulaziz AlAmawi" },
      license: { name: "MIT" },
    },
    servers: [
      { url: "/api/v1", description: "Primary API" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    tags: [
      { name: "System" },
      { name: "Auth" },
      { name: "Users" },
      { name: "Devices" },
      { name: "Rooms" },
      { name: "DeviceGroups" },
      { name: "Automation" },
      { name: "Schedules" },
      { name: "Energy" },
      { name: "Notifications" },
      { name: "Recommendations" },
      { name: "Analytics" },
      { name: "Settings" },
      { name: "Audit" },
    ],
  },
  apis: ["./src/modules/**/*.routes.ts", "./src/routes/*.ts", "./dist/modules/**/*.routes.js", "./dist/routes/*.js"],
});
