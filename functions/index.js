// functions/index.js - VERSIÓN COMPLETA CON PLANTILLA EXCEL (ACTUALIZADA)
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/logger");
const admin = require("firebase-admin");
const ExcelJS = require("exceljs");
const axios = require("axios");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

// Inicializar Firebase Admin
admin.initializeApp();

// Ruta de la plantilla en Storage
const TEMPLATE_PATH = "templates/plantilla_inventario.xlsx";

// ============================================
// 1. FUNCIÓN PARA CARGAR PLANTILLA DESDE STORAGE
// ============================================
async function loadTemplateFromStorage() {
  try {
    logger.info("📁 Cargando plantilla desde Storage...");

    const bucket = admin.storage().bucket();
    const templateFile = bucket.file(TEMPLATE_PATH);

    const [exists] = await templateFile.exists();
    if (!exists) {
      throw new Error(`Plantilla no encontrada en: ${TEMPLATE_PATH}`);
    }

    const [buffer] = await templateFile.download();
    logger.info(`✅ Plantilla cargada, tamaño: ${buffer.length} bytes`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    return workbook;
  } catch (error) {
    logger.error("❌ Error cargando plantilla:", error);
    throw new Error(`No se pudo cargar la plantilla: ${error.message}`);
  }
}

// ============================================
// 2. FUNCIÓN DE DIAGNÓSTICO (debug)
// ============================================
exports.debugExport = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (req, res) => {
    logger.info("🔍 === INICIANDO DEBUG v7 ===", { structuredData: true });

    try {
      const versionInfo = {
        firebaseFunctions: "v7.0.0",
        nodeVersion: process.version,
        projectId: process.env.GCLOUD_PROJECT,
        region: process.env.FUNCTION_REGION,
      };

      const dependencies = {
        admin: typeof admin !== "undefined",
        ExcelJS: typeof ExcelJS !== "undefined",
        axios: typeof axios !== "undefined",
        sharp: typeof sharp !== "undefined",
      };

      const db = admin.firestore();
      const collections = await db.listCollections();
      const collectionNames = collections.map((col) => col.id);

      const bucket = admin.storage().bucket();
      const bucketName = bucket.name;

      const templateFile = bucket.file(TEMPLATE_PATH);
      const [templateExists] = await templateFile.exists();

      const response = {
        success: true,
        message: "✅ Debug exitoso - Firebase Functions v7 funcionando",
        debug: {
          versions: versionInfo,
          dependencies: dependencies,
          firestore: {
            available: true,
            collections: collectionNames,
            totalCollections: collectionNames.length,
          },
          storage: {
            available: true,
            bucketName: bucketName,
            templateExists: templateExists,
            templatePath: TEMPLATE_PATH,
          },
        },
        timestamp: new Date().toISOString(),
      };

      logger.info("🎉 Debug completado exitosamente", response.debug);
      return res.json(response);
    } catch (error) {
      logger.error("💥 ERROR en debug:", {
        error: error.message,
        stack: error.stack,
        code: error.code,
      });

      return res.status(500).json({
        success: false,
        error: "Debug falló",
        details: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// ============================================
// 3. FUNCIÓN PRINCIPAL - EXPORTAR CON PLANTILLA
// ============================================
exports.exportInventory = onRequest(
  {
    cors: true,
    timeoutSeconds: 540,
    memory: "2GiB",
    minInstances: 0,
    maxInstances: 10,
  },
  async (req, res) => {
    logger.info("🚀 === INICIANDO EXPORTACIÓN CON PLANTILLA ===", {
      structuredData: true,
    });

    let inventoryId = null;

    try {
      // 1. VALIDAR ENTRADA
      inventoryId = req.body?.inventoryId;

      if (!inventoryId) {
        logger.error("❌ No se recibió inventoryId", { body: req.body });
        return res.status(400).json({
          success: false,
          error: "Se requiere 'inventoryId' en el cuerpo de la solicitud",
          example: { inventoryId: "tu-id-de-inventario" },
        });
      }

      logger.info(`📋 Inventory ID recibido: ${inventoryId}`);

      const db = admin.firestore();

      // 2. OBTENER INVENTARIO
      logger.info(`🔍 Buscando inventario: ${inventoryId}`);
      const inventarioRef = db.collection("inventarios").doc(inventoryId);
      const inventarioDoc = await inventarioRef.get();

      if (!inventarioDoc.exists) {
        logger.error(`❌ Inventario no encontrado: ${inventoryId}`);
        return res.status(404).json({
          success: false,
          error: `Inventario no encontrado: ${inventoryId}`,
        });
      }

      const inventarioData = inventarioDoc.data();
      logger.info(
        `✅ Inventario encontrado: ${inventarioData.mes} ${inventarioData.anio}`,
      );

      // 3. OBTENER EQUIPOS
      logger.info(`📊 Obteniendo equipos de la subcolección...`);
      const equiposSnapshot = await inventarioRef.collection("equipos").get();

      const totalEquipos = equiposSnapshot.size;
      logger.info(`📦 Total equipos encontrados: ${totalEquipos}`);

      if (totalEquipos === 0) {
        return res.json({
          success: true,
          message: "No hay equipos para exportar",
          data: {
            inventario: `${inventarioData.mes} ${inventarioData.anio}`,
          },
        });
      }

      // 4. CARGAR PLANTILLA EXCEL
      logger.info("📗 Cargando plantilla Excel...");
      const workbook = await loadTemplateFromStorage();
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new Error(
          "No se pudo obtener la hoja de trabajo de la plantilla",
        );
      }

      logger.info("✅ Plantilla cargada correctamente");

      // ========== DATOS FIJOS ==========
      const fecha = new Date();
      const dia = fecha.getDate().toString().padStart(2, "0");
      const meses = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ];
      const mes = meses[fecha.getMonth()];
      const año = fecha.getFullYear();
      const fechaActualizacion = `${dia} de ${mes} del ${año}`;

      worksheet.getCell("C2").value = fechaActualizacion;
      logger.info(`📅 Fecha actualización en M2: ${fechaActualizacion}`);

      worksheet.getCell("C5").value = inventarioData.estado || "";
      logger.info(`📍 Estado en M5: ${inventarioData.estado || ""}`);

      worksheet.getCell("C6").value = inventarioData.localidad || "";
      logger.info(`🏢 Localidad en M6: ${inventarioData.localidad || ""}`);

      // ========== PROCESAR EQUIPOS (DESDE FILA 2) ==========
      logger.info(`🖼️ Procesando ${totalEquipos} equipos...`);
      let currentRow = 13;
      let imagenesProcesadas = 0;
      let imagenesFallidas = 0;

      // Mapeo de estados (9 opciones)
      const estadoMap = {
        baja: "Baja",
        danado_destruccion: "Dañado Destrucción",
        donacion: "Donación",
        reparacion: "En Reparación",
        nuevo: "Nuevo",
        renovado: "Renovado",
        venta: "Venta",
        usado_garantia: "Usado con Garantía",
        usado_sin_garantia: "Usado Sin Garantía",
      };

      for (const doc of equiposSnapshot.docs) {
        const equipo = doc.data();

        // Leer todos los campos
        const serial = equipo.serial || "N/A";
        const perfil = equipo.perfil || "Standard";
        const ubicacion = equipo.ubicacion || "";
        const estadoOriginal = equipo.estado;
        const esquema = equipo.esquema || "Activo Fijo";
        const observaciones = equipo.observaciones || "";
        const nota = equipo.nota || "";
        const imagenUrl = equipo.imagenUrl || null;

        // Transformar estado
        const estadoTransformado =
          estadoMap[estadoOriginal] || estadoOriginal || "Sin especificar";

        // Escribir en columnas B a I
        worksheet.getCell(`B${currentRow}`).value = serial;
        worksheet.getCell(`C${currentRow}`).value = perfil;
        worksheet.getCell(`D${currentRow}`).value = ubicacion;
        worksheet.getCell(`E${currentRow}`).value = estadoTransformado;
        worksheet.getCell(`F${currentRow}`).value = esquema;
        worksheet.getCell(`G${currentRow}`).value = observaciones;
        worksheet.getCell(`H${currentRow}`).value = nota;

        // Imagen en columna I
        // Imagen en columna I (mejorada)
        if (imagenUrl) {
          try {
            const imageResponse = await axios.get(imagenUrl, {
              responseType: "arraybuffer",
              timeout: 15000,
            });

            if (imageResponse.data) {
              const miniaturaBuffer = await sharp(imageResponse.data)
                .resize(320, 240, {
                  fit: "cover",
                  position: "center",
                  background: { r: 255, g: 255, b: 255 },
                })
                .png({ quality: 85, compressionLevel: 6 })
                .toBuffer();

              const imageId = workbook.addImage({
                buffer: miniaturaBuffer,
                extension: "png",
              });

              worksheet.addImage(imageId, {
                tl: {
                  col: 8,
                  row: currentRow - 1,
                  nativeColOff: 5,
                  nativeRowOff: 5,
                },
                br: {
                  col: 9,
                  row: currentRow,
                  nativeColOff: -5,
                  nativeRowOff: -5,
                },
                editAs: "oneCell",
              });

              imagenesProcesadas++;
            }
          } catch (imgError) {
            imagenesFallidas++;
            worksheet.getCell(`I${currentRow}`).value =
              "❌ Imagen no disponible";
          }
        } else {
          worksheet.getCell(`I${currentRow}`).value = "📷 Sin imagen";
        }

        currentRow++;

        // Pequeña pausa cada 10 equipos
        if ((currentRow - 2) % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const totalProcesados = currentRow - 2;
      logger.info(`📊 Resumen de equipos: ${totalProcesados} procesados`);
      logger.info(
        `   Imágenes: ${imagenesProcesadas} exitosas, ${imagenesFallidas} fallidas`,
      );

      // 6. GENERAR ARCHIVO EXCEL
      logger.info("💾 Generando archivo Excel...");
      const excelBuffer = await workbook.xlsx.writeBuffer();
      const fileSizeMB = (excelBuffer.length / 1024 / 1024).toFixed(2);
      logger.info(`📏 Tamaño del archivo: ${fileSizeMB} MB`);

      // 7. SUBIR A FIREBASE STORAGE
      const fileName = `inventario_${inventarioData.mes}_${inventarioData.anio}_${Date.now()}.xlsx`;
      const filePath = `exports/${fileName}`;

      logger.info(`☁️ Subiendo a Storage: ${filePath}`);

      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      const accessToken = uuidv4();

      const metadata = {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        metadata: {
          inventoryId: inventoryId,
          inventoryName: `${inventarioData.mes} ${inventarioData.anio}`,
          totalEquipos: totalProcesados,
          imagenesProcesadas: imagenesProcesadas,
          exportDate: new Date().toISOString(),
          generatedBy: "Firebase Functions v7 - Template",
          firebaseStorageDownloadTokens: accessToken,
        },
        cacheControl: "public, max-age=31536000",
      };

      await file.save(excelBuffer, { metadata: metadata });
      await file.makePublic();

      // Actualizar metadata con token
      try {
        const [currentMetadata] = await file.getMetadata();
        await file.setMetadata({
          metadata: {
            ...currentMetadata.metadata,
            firebaseStorageDownloadTokens: accessToken,
          },
        });
        logger.info(`✅ Token guardado en metadata`);
      } catch (metadataError) {
        logger.warn(`⚠️ Error actualizando metadata: ${metadataError.message}`);
      }

      logger.info(`✅ Archivo subido exitosamente: ${fileName}`);

      // 8. GENERAR URL DE DESCARGA
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${accessToken}`;
      const googleCloudUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(filePath)}`;

      logger.info(`📎 URL de descarga generada`);

      // 9. RESPONDER CON ÉXITO
      const response = {
        success: true,
        message: "✅ Inventario exportado exitosamente usando plantilla",
        data: {
          inventario: {
            id: inventoryId,
            nombre: `${inventarioData.mes} ${inventarioData.anio}`,
            localidad: inventarioData.localidad,
            estado: inventarioData.estado,
          },
          exportacion: {
            totalEquipos: totalProcesados,
            imagenesProcesadas: imagenesProcesadas,
            imagenesFallidas: imagenesFallidas,
            fileSizeMB: parseFloat(fileSizeMB),
            fileName: fileName,
            downloadUrl: downloadUrl,
            accessToken: accessToken,
            urls: {
              firebaseWithToken: downloadUrl,
              googleCloud: googleCloudUrl,
            },
            bucketPath: filePath,
            storageBucket: bucket.name,
          },
        },
        timestamp: new Date().toISOString(),
      };

      logger.info("🎉 === EXPORTACIÓN COMPLETADA ===");
      return res.json(response);
    } catch (error) {
      logger.error("💥 === ERROR EN EXPORTACIÓN ===", {
        inventoryId: inventoryId,
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
      });

      const errorResponse = {
        success: false,
        error: "Error al procesar la exportación",
        inventoryId: inventoryId,
        timestamp: new Date().toISOString(),
        details: error.message,
        suggestion:
          "Verifica que la plantilla exista en storage/templates/plantilla_inventario.xlsx",
      };

      return res.status(500).json(errorResponse);
    }
  },
);

// ============================================
// 4. FUNCIÓN PARA VERIFICAR ARCHIVOS EN STORAGE
// ============================================
exports.verifyExport = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (req, res) => {
    try {
      const { inventoryId } = req.body;

      if (!inventoryId) {
        return res.status(400).json({ error: "Se requiere inventoryId" });
      }

      const db = admin.firestore();
      const bucket = admin.storage().bucket();

      const inventarioDoc = await db
        .collection("inventarios")
        .doc(inventoryId)
        .get();

      if (!inventarioDoc.exists) {
        return res.status(404).json({ error: "Inventario no encontrado" });
      }

      const inventarioData = inventarioDoc.data();

      const [files] = await bucket.getFiles({
        prefix: `exports/inventario_${inventarioData.mes}_${inventarioData.anio}`,
      });

      const fileList = await Promise.all(
        files.map(async (file) => {
          const [metadata] = await file.getMetadata();
          return {
            name: file.name,
            created: metadata.timeCreated,
            size: metadata.size,
            contentType: metadata.contentType,
            publicUrl: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
          };
        }),
      );

      res.json({
        success: true,
        inventory: `${inventarioData.mes} ${inventarioData.anio}`,
        filesFound: files.length,
        files: fileList,
        suggestion:
          files.length > 0
            ? "Usa downloadUrl para descargar el archivo"
            : "No hay archivos exportados para este inventario",
      });
    } catch (error) {
      console.error("Error en verifyExport:", error);
      res.status(500).json({
        error: "Error en verificación",
        details: error.message,
      });
    }
  },
);
