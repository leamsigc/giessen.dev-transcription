/**
 * useFileValidation Composable
 *
 * Handles file validation for transcription.
 *
 * @author Ismael Garcia <leamsigc@leamsigc.com>
 * @version 0.0.1
 */

export const useFileValidation = () => {
	const isValidFile = (file: File): boolean => {
		return file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3");
	};

	const validateFiles = (files: File[]): { valid: File[], invalid: File[] } => {
		const valid = files.filter(isValidFile);
		const invalid = files.filter((file) => !isValidFile(file));
		return { valid, invalid };
	};

	return {
		isValidFile,
		validateFiles
	};
};
