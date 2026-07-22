import { toPublicUploadPath } from "../config/paths.js";

/**
 * Applies Multer's uploaded file paths to the nested registration/update payload.
 * Both registration and pending-update endpoints use the same multipart field names.
 */
export function attachUploadedFiles(payload, files = []) {
  const uploadedFiles = Array.isArray(files) ? files : [];

  for (const file of uploadedFiles) {
    const publicPath = toPublicUploadPath(file.path);

    if (file.fieldname === "profile_image") {
      payload.user ??= {};
      payload.user.profile_image = publicPath;
      continue;
    }

    if (file.fieldname.startsWith("address_image_")) {
      const addressIndex = Number(file.fieldname.split("_")[2]);
      if (Number.isInteger(addressIndex) && payload.addresses?.[addressIndex]) {
        payload.addresses[addressIndex].address_image = publicPath;
      }
      continue;
    }

    if (file.fieldname.startsWith("salary_image_")) {
      const [, , employmentIndex, salaryIndex] = file.fieldname.split("_");
      const employmentPosition = Number(employmentIndex);
      const salaryPosition = Number(salaryIndex);

      if (
        Number.isInteger(employmentPosition) &&
        Number.isInteger(salaryPosition) &&
        payload.employments?.[employmentPosition]?.salaries?.[salaryPosition]
      ) {
        payload.employments[employmentPosition].salaries[salaryPosition].salary_image = publicPath;
      }
    }
  }

  return payload;
}
