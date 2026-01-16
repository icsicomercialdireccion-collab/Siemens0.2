// functions/index.js - VERSIÓN COMPATIBLE CON v7.0.0
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/logger");
const admin = require("firebase-admin");
const ExcelJS = require("exceljs");
const axios = require("axios");
const sharp = require("sharp");

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
  }
);

// ============================================
// 2. FUNCIÓN PRINCIPAL - EXPORTAR CON IMÁGENES
// ============================================
exports.exportInventory = onRequest(
  {
    cors: true,
    timeoutSeconds: 300, // 5 minutos para procesar imágenes
    memory: "1GiB", // 1GB de RAM para imágenes
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
        }
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

      // 5. CONFIGURAR COLUMNAS (IMPORTANTE: columna para imágenes)
      worksheet.columns = [
        { header: "#", key: "numero", width: 8 },
        { header: "SERIAL", key: "serial", width: 25 },
        { header: "MODELO", key: "modelo", width: 20 },
        { header: "MARCA", key: "marca", width: 15 },
        { header: "ESTADO", key: "estado", width: 15 },
        { header: "UBICACIÓN", key: "ubicacion", width: 20 },
        { header: "IMAGEN", key: "imagen", width: 25 }, // ← Columna para miniaturas
        { header: "OBSERVACIONES", key: "observaciones", width: 30 },
      ];

      // Estilo para encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2196F3" }, // Azul
      };
      headerRow.alignment = { horizontal: "center" };

      // Ajustar altura de filas para imágenes
      worksheet.properties.defaultRowHeight = 95;

      // 6. PROCESAR EQUIPOS CON IMÁGENES
      logger.info(`🖼️ Procesando ${totalEquipos} equipos con imágenes...`);
      let contador = 0;
      let imagenesProcesadas = 0;
      let imagenesFallidas = 0;

      for (const doc of equiposSnapshot.docs) {
        contador++;
        const equipo = doc.data();
        const equipoId = doc.id;

        logger.info(
          `   📝 Procesando equipo ${contador}/${totalEquipos}: ${equipoId}`,
          {
            serial: equipo.serial,
            tieneImagen: !!(equipo.imagenUrl || equipo.fotoUrl),
          }
        );

        // Datos básicos del equipo
        const rowData = {
          numero: contador,
          serial: equipo.serial || equipo.numeroSerie || equipo.codigo || "N/A",
          modelo: equipo.modelo || equipo.tipo || "N/A",
          marca: equipo.marca || "N/A",
          estado: equipo.estado || "Pendiente",
          ubicacion:
            equipo.ubicacion ||
            equipo.departamento ||
            inventarioData.localidad ||
            "N/A",
          imagen: "📷",
          observaciones:
            equipo.observaciones ||
            equipo.descripcion ||
            equipo.comentarios ||
            "",
        };

        // Agregar fila al Excel
        const row = worksheet.addRow(rowData);

        // PROCESAR IMAGEN SI EXISTE
        const imagenUrl = equipo.imagenUrl || equipo.fotoUrl;
        if (imagenUrl) {
          try {
            logger.info(`      🖼️ Descargando imagen...`, {
              url: imagenUrl.substring(0, 100),
            });

            // Descargar imagen con timeout
            const imageResponse = await axios.get(imagenUrl, {
              responseType: "arraybuffer",
              timeout: 15000, // 15 segundos máximo
              maxContentLength: 10 * 1024 * 1024, // 10MB máximo
            });

            if (imageResponse.data && imageResponse.data.length > 0) {
              logger.info(`      🔄 Creando miniatura 100x100...`);

              // Crear miniatura con sharp
              const miniaturaBuffer = await sharp(imageResponse.data)
                .resize(100, 100, {
                  fit: "cover",
                  position: "center",
                  withoutEnlargement: true,
                })
                .jpeg({
                  quality: 85,
                  mozjpeg: true,
                })
                .toBuffer();

              // Agregar imagen al libro de Excel
              const imageId = workbook.addImage({
                buffer: miniaturaBuffer,
                extension: "jpeg",
              });

              // Calcular posición (columna G = 7, pero 0-indexed es 6)
              // Ajustar según tu estructura de columnas
              worksheet.addImage(imageId, {
                tl: { col: 6, row: row.number - 1 }, // Columna G (IMAGEN)
                br: { col: 7, row: row.number },
                editAs: "oneCell",
              });

              imagenesProcesadas++;
              logger.info(`      ✅ Imagen incrustada exitosamente`);
            }
          } catch (imgError) {
            imagenesFallidas++;
            logger.warn(
              `      ⚠️ Error procesando imagen: ${imgError.message}`,
              {
                equipoId: equipoId,
                errorCode: imgError.code,
              }
            );
            // Continuar sin imagen - la celda tendrá solo el emoji 📷
          }
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
      worksheet.addRow([]); // Fila vacía

      const infoRow = worksheet.addRow([
        `INVENTARIO: ${inventarioData.mes} ${inventarioData.anio} | ` +
          `LOCALIDAD: ${inventarioData.localidad} | ` +
          `TOTAL EQUIPOS: ${totalEquipos} | ` +
          `IMÁGENES: ${imagenesProcesadas}/${totalEquipos}`,
      ]);

      worksheet.mergeCells(`A${infoRow.number}:H${infoRow.number}`);
      infoRow.font = { bold: true, size: 12, color: { argb: "FF4CAF50" } }; // Verde
      infoRow.alignment = { horizontal: "center" };
      infoRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F8FF" }, // Azul muy claro
      };

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

      await file.save(excelBuffer, {
        metadata: {
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
          },
        },
      });

      logger.info(`✅ Archivo subido exitosamente: ${fileName}`);

      // 10. GENERAR URL FIRMADA PARA DESCARGA (24 horas)
      logger.info("🔗 Generando URL de descarga...");
      let downloadUrl;
      let downloadType = "unknown";

      try {
        // OPCIÓN 1: Intentar URL firmada (preferida)
        logger.info("   Intentando URL firmada...");
        const [signedUrl] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
          version: "v4",
        });
        downloadUrl = signedUrl;
        downloadType = "signed";
        logger.info("✅ URL firmada generada (24 horas)");
      } catch (signError) {
        logger.warn(`⚠️ No se pudo generar URL firmada: ${signError.message}`);

        try {
          // OPCIÓN 2: Hacer el archivo público y usar URL pública
          logger.info("   Intentando hacer archivo público...");
          await file.makePublic();

          // Generar URL pública
          downloadUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
          downloadType = "public";
          logger.info("✅ URL pública generada (archivo público)");
        } catch (publicError) {
          logger.warn(
            `⚠️ No se pudo hacer archivo público: ${publicError.message}`
          );

          try {
            // OPCIÓN 3: Obtener URL de acceso público si ya existe
            downloadUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            downloadType = "public_link";
            logger.info(
              "✅ Usando link público (puede requerir autenticación)"
            );
          } catch (linkError) {
            logger.warn(
              `⚠️ No se pudo generar ningún tipo de URL: ${linkError.message}`
            );

            // OPCIÓN 4: Enviar el archivo directamente en la respuesta
            logger.info("📤 Enviando archivo directamente...");

            // Configurar headers para descarga
            res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${fileName}"`
            );

            // Enviar buffer directamente
            return res.send(excelBuffer);
          }
        }
      }

      logger.info(`🔗 URL de descarga generada (válida por 24 horas)`);

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
            // AQUI ASEGURAR QUE downloadUrl NO SEA undefined
            downloadUrl:
              downloadUrl ||
              `https://storage.googleapis.com/${bucket.name}/${filePath}`,
            downloadType: downloadType,
            expiresAt:
              downloadType === "signed"
                ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                : "indefinido",
            bucketPath: filePath,
            storageBucket: bucket.name,
          },
        },
        timestamp: new Date().toISOString(),
      };

      // VERIFICAR ANTES DE ENVIAR
      if (!response.data.exportacion.downloadUrl) {
        logger.error(
          "⚠️ CRÍTICO: downloadUrl es undefined, generando URL de respaldo"
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
        // Información útil para debugging
      };

      // Solo agregar detalles si estamos en desarrollo
      const isDevelopment =
        process.env.NODE_ENV === "development" ||
        process.env.FUNCTIONS_EMULATOR === "true";

      if (isDevelopment && errorResponse._info) {
        errorResponse._info.details = error.message;
        errorResponse._info.code = error.code;
      }

      return res.status(500).json(errorResponse);
    }
  }
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
  }
);
