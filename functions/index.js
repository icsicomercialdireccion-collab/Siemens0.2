// functions/index.js - VERSIÓN COMPATIBLE CON v7.0.0
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/logger");
const admin = require("firebase-admin");
const ExcelJS = require("exceljs");
const axios = require("axios");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

// Inicializar Firebase Admin
admin.initializeApp();

// ============================================
// 1. FUNCIÓN DE DIAGNÓSTICO (debug)
// ============================================
exports.debugExport = onRequest(
  {
    cors: true, // Habilitar CORS
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (req, res) => {
    logger.info("🔍 === INICIANDO DEBUG v7 ===", { structuredData: true });

    try {
      // 1. Verificar versión
      logger.info("1. Verificando entorno...");
      const versionInfo = {
        firebaseFunctions: "v7.0.0",
        nodeVersion: process.version,
        projectId: process.env.GCLOUD_PROJECT,
        region: process.env.FUNCTION_REGION,
      };

      // 2. Probar dependencias
      logger.info("2. Probando dependencias...");
      const dependencies = {
        admin: typeof admin !== "undefined",
        ExcelJS: typeof ExcelJS !== "undefined",
        axios: typeof axios !== "undefined",
        sharp: typeof sharp !== "undefined",
      };

      // 3. Probar Firestore
      logger.info("3. Probando Firestore...");
      const db = admin.firestore();
      const collections = await db.listCollections();
      const collectionNames = collections.map((col) => col.id);

      // 4. Probar Storage
      logger.info("4. Probando Storage...");
      const bucket = admin.storage().bucket();
      const bucketName = bucket.name;

      // 5. Responder con toda la info
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
          },
          request: {
            method: req.method,
            body: req.body,
            query: req.query,
            headers: req.headers,
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
// 2. FUNCIÓN PRINCIPAL - EXPORTAR CON IMÁGENES
// ============================================
exports.exportInventory = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: "1GiB",
    minInstances: 0,
    maxInstances: 10,
  },
  async (req, res) => {
    logger.info("🚀 === INICIANDO EXPORTACIÓN CON IMÁGENES ===", {
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
          suggestion: "Verifica que el ID sea correcto",
        });
      }

      const inventarioData = inventarioDoc.data();
      logger.info(
        `✅ Inventario encontrado: ${inventarioData.mes} ${inventarioData.anio}`,
        {
          localidad: inventarioData.localidad,
          estado: inventarioData.estado,
        },
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
            localidad: inventarioData.localidad,
            estado: inventarioData.estado,
          },
        });
      }

      // 4. CREAR LIBRO DE EXCEL
      logger.info("📗 Creando libro de Excel...");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Siemens Inventory App";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Inventario");

      // 5. CONFIGURAR COLUMNAS (SOLO LAS QUE NECESITAS)
      worksheet.columns = [
        { header: "#", key: "numero", width: 8 },
        { header: "SERIAL", key: "serial", width: 25 },
        { header: "ESTADO", key: "estado", width: 15 },
        { header: "COMENTARIO", key: "comentario", width: 30 },
        { header: "IMAGEN", key: "imagen", width: 25 },
      ];

      // Estilo para encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2196F3" }, // Azul
      };
      headerRow.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      headerRow.height = 25;

      // Configurar estilo de borde para todas las celdas
      const cellBorder = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };

      // 6. PROCESAR EQUIPOS CON IMÁGENES - SIN ESPACIOS
      logger.info(`🖼️ Procesando ${totalEquipos} equipos con imágenes...`);
      let contador = 0;
      let imagenesProcesadas = 0;
      let imagenesFallidas = 0;

      // IMPORTANTE: Primero preparar todos los datos
      const equiposData = [];
      for (const doc of equiposSnapshot.docs) {
        contador++;
        const equipo = doc.data();

        equiposData.push({
          id: doc.id,
          numero: contador,
          serial: equipo.serial || equipo.numeroSerie || equipo.codigo || "N/A",
          estado: equipo.estado || "Pendiente",
          comentario:
            equipo.comentario ||
            equipo.observaciones ||
            equipo.descripcion ||
            equipo.comentarios ||
            "",
          imagenUrl: equipo.imagenUrl || equipo.fotoUrl || null,
        });
      }

      // AHORA agregar todas las filas de una vez
      contador = 0;
      for (const equipo of equiposData) {
        contador++;
        const rowNumber = contador + 1; // +1 por la fila de encabezado

        logger.info(
          `   📝 Procesando equipo ${contador}/${totalEquipos}: ${equipo.id}`,
        );

        // Usar insertRow en lugar de addRow para evitar espacios
        const row = worksheet.insertRow(rowNumber, [
          equipo.numero,
          equipo.serial,
          equipo.estado,
          equipo.comentario,
          "", // Celda vacía para imagen
        ]);

        // Configurar altura de la fila
        row.height = 120; // Altura más manejable

        // Aplicar estilos a todas las celdas de esta fila
        row.eachCell((cell, colNumber) => {
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
          };
          cell.border = cellBorder;
        });

        // PROCESAR IMAGEN SI EXISTE
        if (equipo.imagenUrl) {
          try {
            logger.info(`      🖼️ Descargando imagen...`, {
              url: equipo.imagenUrl.substring(0, 100),
            });

            // Descargar imagen con timeout
            const imageResponse = await axios.get(equipo.imagenUrl, {
              responseType: "arraybuffer",
              timeout: 15000,
              maxContentLength: 10 * 1024 * 1024,
            });

            if (imageResponse.data && imageResponse.data.length > 0) {
              logger.info(`      🔄 Creando miniatura...`);

              // Crear miniatura
              const miniaturaBuffer = await sharp(imageResponse.data)
                .resize(350, 250, {
                  fit: "contain",
                  position: "center",
                  withoutEnlargement: true,
                  background: { r: 255, g: 255, b: 255 },
                })
                .jpeg({
                  quality: 90,
                  mozjpeg: true,
                })
                .toBuffer();

              // Agregar imagen al libro de Excel
              const imageId = workbook.addImage({
                buffer: miniaturaBuffer,
                extension: "jpeg",
              });

              // Posicionar imagen en la celda E (columna 5, índice 4)
              worksheet.addImage(imageId, {
                tl: { col: 4, row: rowNumber - 1 },
                br: { col: 5, row: rowNumber },
                editAs: "unfined",
              });

              imagenesProcesadas++;
              logger.info(`      ✅ Imagen incrustada en celda E${rowNumber}`);
            }
          } catch (imgError) {
            imagenesFallidas++;
            logger.warn(
              `      ⚠️ Error procesando imagen: ${imgError.message}`,
            );
            // Si falla la imagen, poner texto en la celda
            row.getCell(5).value = "❌ Imagen no disponible";
          }
        } else {
          // Si no hay imagen, mostrar texto
          row.getCell(5).value = "📷 Sin imagen";
        }

        // Pequeña pausa para no sobrecargar
        if (contador % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      logger.info(`📊 Resumen de imágenes:`, {
        procesadas: imagenesProcesadas,
        fallidas: imagenesFallidas,
        total: totalEquipos,
      });

      // 7. AGREGAR INFORMACIÓN DE RESUMEN
      // Agregar fila de información en la última posición + 2
      const infoRowNumber = worksheet.rowCount + 2;
      const infoRow = worksheet.getRow(infoRowNumber);
      infoRow.values = [
        `INVENTARIO: ${inventarioData.mes} ${inventarioData.anio} | ` +
          `LOCALIDAD: ${inventarioData.localidad} | ` +
          `TOTAL: ${totalEquipos} equipos | ` +
          `IMÁGENES: ${imagenesProcesadas}/${totalEquipos}`,
      ];

      // Combinar celdas para la fila de información (A a E)
      worksheet.mergeCells(`A${infoRowNumber}:E${infoRowNumber}`);
      infoRow.font = { bold: true, size: 12, color: { argb: "FF4CAF50" } };
      infoRow.alignment = { horizontal: "center" };
      infoRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F8FF" }, // Azul muy claro
      };
      infoRow.height = 25;

      // 8. GENERAR ARCHIVO EXCEL
      logger.info("💾 Generando archivo Excel...");
      const excelBuffer = await workbook.xlsx.writeBuffer();
      const fileSizeMB = (excelBuffer.length / 1024 / 1024).toFixed(2);

      logger.info(`📏 Tamaño del archivo: ${fileSizeMB} MB`);

      // 9. SUBIR A FIREBASE STORAGE
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
          localidad: inventarioData.localidad,
          totalEquipos: totalEquipos,
          imagenesProcesadas: imagenesProcesadas,
          exportDate: new Date().toISOString(),
          generatedBy: "Firebase Functions v7",
          firebaseStorageDownloadTokens: accessToken, // TOKEN ESPECIAL PARA LINKS AZULES
        },
        cacheControl: "public, max-age=31536000",
      };

      // Subir archivo
      await file.save(excelBuffer, { metadata: metadata });

      // Hacer público (IMPORTANTE)
      await file.makePublic();

      // Para asegurar que el token se guardó correctamente, actualizamos metadata
      try {
        // Primero obtenemos la metadata actual
        const [currentMetadata] = await file.getMetadata();

        // Actualizamos solo el token en metadata
        await file.setMetadata({
          metadata: {
            ...currentMetadata.metadata,
            firebaseStorageDownloadTokens: accessToken,
          },
        });

        logger.info(`✅ Token guardado en metadata del archivo`);
      } catch (metadataError) {
        logger.warn(`⚠️ Error actualizando metadata: ${metadataError.message}`);
      }

      logger.info(`✅ Archivo subido exitosamente: ${fileName}`);

      // 10. GENERAR URL DE DESCARGA CON TOKEN (ASÍ CREAS LINKS AZULES)
      logger.info("🔗 Generando URL de descarga con token...");

      // ESTA ES LA FORMA CORRECTA PARA LINKS AZULES EN FIREBASE CONSOLE
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${accessToken}`;

      // URL alternativa (también debería funcionar)
      const googleCloudUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(filePath)}`;

      logger.info(`📎 URL Firebase con token: ${downloadUrl}`);
      logger.info(`📎 URL Google Cloud: ${googleCloudUrl}`);

      // 11. RESPONDER CON ÉXITO
      const response = {
        success: true,
        message:
          "✅ Inventario exportado exitosamente con imágenes incrustadas",
        data: {
          inventario: {
            id: inventoryId,
            nombre: `${inventarioData.mes} ${inventarioData.anio}`,
            localidad: inventarioData.localidad,
            estado: inventarioData.estado,
          },
          exportacion: {
            totalEquipos: totalEquipos,
            imagenesProcesadas: imagenesProcesadas,
            imagenesFallidas: imagenesFallidas,
            fileSizeMB: parseFloat(fileSizeMB),
            fileName: fileName,

            // USAR LA URL CON TOKEN PARA EL LINK AZUL
            downloadUrl: downloadUrl,

            // Información del token
            accessToken: accessToken,

            // URLs alternativas
            urls: {
              // ESTA es la que hace el link azul en Firebase Console
              firebaseWithToken: downloadUrl,

              // Estas son alternativas
              googleCloud: googleCloudUrl,
              firebaseStorage: `https://${bucket.name}.firebasestorage.app/${encodeURIComponent(filePath)}?token=${accessToken}`,
            },

            bucketPath: filePath,
            storageBucket: bucket.name,
          },
        },
        timestamp: new Date().toISOString(),
      };

      // VERIFICAR ANTES DE ENVIAR
      if (!response.data.exportacion.downloadUrl) {
        logger.error(
          "⚠️ CRÍTICO: downloadUrl es undefined, generando URL de respaldo",
        );
        response.data.exportacion.downloadUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        response.data.exportacion.downloadType = "public_backup";
      }

      logger.info("🎉 === EXPORTACIÓN COMPLETADA ===", {
        fileName: fileName,
        downloadUrl: response.data.exportacion.downloadUrl,
        downloadType: response.data.exportacion.downloadType,
      });

      return res.json(response);
    } catch (error) {
      // ERROR DETALLADO PERO MEJORADO
      logger.error("💥 === ERROR EN EXPORTACIÓN ===", {
        inventoryId: inventoryId,
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        timestamp: new Date().toISOString(),
        step: "Verificar logs anteriores para más contexto",
      });

      // Respuesta de error más informativa
      const errorResponse = {
        success: false,
        error: "Error al procesar la exportación",
        inventoryId: inventoryId,
        timestamp: new Date().toISOString(),
        suggestion:
          "El archivo Excel pudo haberse generado en Storage, verifica en Firebase Console",
      };

      return res.status(500).json(errorResponse);
    }
  },
);

// ============================================
// 3. FUNCIÓN PARA VERIFICAR ARCHIVOS EN STORAGE
// ============================================
exports.verifyExport = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (req, res) => {
    try {
      const { inventoryId, fileName } = req.body;

      if (!inventoryId) {
        return res.status(400).json({ error: "Se requiere inventoryId" });
      }

      const db = admin.firestore();
      const bucket = admin.storage().bucket();

      // 1. Verificar inventario
      const inventarioDoc = await db
        .collection("inventarios")
        .doc(inventoryId)
        .get();
      if (!inventarioDoc.exists) {
        return res.status(404).json({ error: "Inventario no encontrado" });
      }

      const inventarioData = inventarioDoc.data();

      // 2. Buscar archivos en Storage
      const [files] = await bucket.getFiles({
        prefix: `exports/inventario_${inventarioData.mes}_${inventarioData.anio}`,
      });

      const fileList = files.map((file) => {
        const fileInfo = {
          name: file.name,
          created: file.metadata?.timeCreated,
          size: file.metadata?.size,
          contentType: file.metadata?.contentType,
          public: file.isPublic?.() || false,
        };

        // Intentar generar URLs
        try {
          fileInfo.publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

          // Intentar URL firmada
          return file
            .getSignedUrl({
              action: "read",
              expires: Date.now() + 3600000,
            })
            .then(([signedUrl]) => {
              fileInfo.signedUrl = signedUrl;
              return fileInfo;
            })
            .catch(() => {
              fileInfo.signedUrl = "No disponible";
              return fileInfo;
            });
        } catch (error) {
          fileInfo.error = error.message;
          return Promise.resolve(fileInfo);
        }
      });

      const resolvedFiles = await Promise.all(fileList);

      res.json({
        success: true,
        inventory: `${inventarioData.mes} ${inventarioData.anio}`,
        filesFound: resolvedFiles.length,
        files: resolvedFiles,
        suggestion:
          resolvedFiles.length > 0
            ? "Usa publicUrl para descargar directamente"
            : "No hay archivos exportados",
      });
    } catch (error) {
      res.status(500).json({
        error: "Error en verificación",
        details: error.message,
      });
    }
  },
);
