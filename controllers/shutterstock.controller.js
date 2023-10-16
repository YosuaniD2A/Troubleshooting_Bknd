const fs = require("fs");
const csv = require("csv-parser");

const { importCsv, factoryShutterstock, insertDB, saveImages } = require("../Utilities/shutterstock.utilities");


const uploadCSV = async (req, res) => {
    try {
        let listErrorsIDs = [];
        const licenseType = req.body.licenseType
        const filePath = req.file.path;
        const listOfIds = await importCsv(
            fs.createReadStream(filePath).pipe(csv()));

            console.log(licenseType)
        const imageMetadataPromises = await Promise.all(listOfIds.map(async (elem) => {
            const getInfoOfImage = await factoryShutterstock(
                process.env.SHUTTERSTOCK_COMMERCIAL_AND_EDITORIAL_TOKEN
            ).getImageDataWithCredentials(elem.shutterstock_id, licenseType);
            console.log(getInfoOfImage)
            if (getInfoOfImage === 'undefined' || getInfoOfImage.error || getInfoOfImage.errors) {
                console.log(`Error con el ID ${elem.shutterstock_id}`);
                listErrorsIDs.push({id: elem.shutterstock_id});
                return null
            }
            else {
                return {
                    shutterstock_id: getInfoOfImage.id,
                    description: getInfoOfImage.description,
                    categories: getInfoOfImage.categories
                        .map((obj) => obj.name)
                        .join(","),
                    keywords: getInfoOfImage.keywords.toString(),
                    displayname: licenseType === "Commercial" ? getInfoOfImage.assets.huge_jpg.display_name : getInfoOfImage.assets.original.display_name,
                    is_licensable: licenseType === "Commercial" ? getInfoOfImage.assets.huge_jpg.is_licensable : getInfoOfImage.assets.original.is_licensable,
                    requested_date: new Date(),
                    filename: licenseType === "Commercial" ? getInfoOfImage.original_filename : getInfoOfImage.title,
                    license_id: "",
                    contributor: licenseType === "Commercial" ? getInfoOfImage.contributor.id : undefined,
                    is_adult: licenseType === "Commercial" ? getInfoOfImage.is_adult : undefined,
                    file_size: licenseType === "Commercial" ? getInfoOfImage.assets.huge_jpg.file_size : undefined,
                    format: licenseType === "Commercial" ? getInfoOfImage.assets.huge_jpg.format : undefined,
                };
            }
        }));

        res.send({
            licenseType,
            data: imageMetadataPromises,
            listErrorsIDs
        });

    } catch (error) {
        res.status(500).json({
            msg: error.message
        });
    }
};

const saveOnlyMetadata = async (req, res) => {
    const licenseType = req.body.licenseType;
    const data = req.body.data;

    const result = await Promise.all(data.map(async (image) => {
        return await insertDB(image, licenseType);
    }))

    res.send({
        licenseType,
        data: result
    });
}

const downloadAndSave = async (req, res) => {
    const licenseType = req.body.licenseType;
    const data = req.body.data;

    const licenses = await Promise.all(data.map(async (image) => {
        if (image !== null) {
            const result = await insertDB(image, licenseType);
            if(!result.includes('existe')){
                return await factoryShutterstock(process.env.SHUTTERSTOCK_COMMERCIAL_AND_EDITORIAL_TOKEN)
                    .licenseImage(image.shutterstock_id, licenseType);
            }else{
                return 'Archivo no descargado porque ya existe';
            }
        } else {
            return null;
        }
    }));

    const result = await Promise.all(licenses.map(async (elem) => {
        if (elem !== null) {
            if (typeof elem === 'string') {
                return elem;
            }else{
                return await saveImages(elem.data[0].download);
            }
        }
        return null;
    }));

    res.send({
        path: 'C:/Users/yborg/OneDrive/Documents/Proyectos activos/Dashboard D2America/Troubleshooting_bknd/download/',
        licenseType,
        result,
    });
}

module.exports = {
    uploadCSV,
    saveOnlyMetadata,
    downloadAndSave
};