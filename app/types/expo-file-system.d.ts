// app/types/expo-file-system.d.ts
declare module "expo-file-system" {
  export const documentDirectory: string;
  export const cacheDirectory: string;
  export const bundleDirectory: string;

  export function getInfoAsync(
    fileUri: string,
    options?: { size?: boolean; md5?: boolean },
  ): Promise<{ exists: boolean; uri: string; size?: number; md5?: string }>;

  export function copyAsync(options: {
    from: string;
    to: string;
  }): Promise<void>;

  export function deleteAsync(
    fileUri: string,
    options?: { idempotent?: boolean },
  ): Promise<void>;

  export function readDirectoryAsync(dirUri: string): Promise<string[]>;

  // Otros métodos que uses
}
