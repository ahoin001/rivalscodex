export const featureFlags = {
  enableExternalApis: process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_APIS === "true",
  preferApiContent: process.env.NEXT_PUBLIC_PREFER_API_CONTENT === "true",
  allowImageRecache: process.env.NEXT_PUBLIC_ALLOW_IMAGE_RECACHE === "true",
};
