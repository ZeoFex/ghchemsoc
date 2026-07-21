import {
  CLOUDINARY_SETUP_HINT,
  getCloudinaryEnv,
  uploadCmsDocument,
  uploadBufferToCloudinary,
} from "@/lib/cloudinary-server";
import {
  REGISTRATION_FILE_MAX_BYTES,
  fileMatchesAccept,
  normalizeFileAccept,
  type RegistrationFieldDef,
  type RegistrationFileAnswer,
} from "@/lib/event-registration-form";

export function validateRegistrationUploadFile(
  file: File,
  field: RegistrationFieldDef
): string | null {
  if (!file.size) return "Choose a file to upload.";
  if (file.size > REGISTRATION_FILE_MAX_BYTES) {
    return "File must be under 10 MB.";
  }
  if (!fileMatchesAccept(file.name, field.accept)) {
    return `Allowed file types: ${normalizeFileAccept(field.accept)}`;
  }
  return null;
}

function guessMime(file: File): string {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".doc")) return "application/msword";
  if (name.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

export async function uploadEventRegistrationFileFromForm(
  file: File,
  field: RegistrationFieldDef
): Promise<RegistrationFileAnswer> {
  const err = validateRegistrationUploadFile(file, field);
  if (err) throw new Error(err);

  if (!getCloudinaryEnv()) {
    throw new Error(
      `File hosting is not configured. ${CLOUDINARY_SETUP_HINT}`
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = guessMime(file);
  const resourceType = mime.startsWith("image/") ? "image" : "raw";

  const uploaded =
    resourceType === "image"
      ? await uploadBufferToCloudinary(buffer, "event-registrations", undefined, "image")
      : await uploadCmsDocument(buffer, "event-registrations");

  return {
    url: uploaded.secure_url,
    fileName: file.name.slice(0, 200) || "upload",
    publicId: uploaded.public_id,
    mime,
    bytes: buffer.length,
  };
}
