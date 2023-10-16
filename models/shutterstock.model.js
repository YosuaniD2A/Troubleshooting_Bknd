const db = require("../config/dbConfig").promise();

const insertImageCommercialMetadata = (imageMetadata) => {
    return db.query('INSERT INTO shutterstock_prueba (shutterstock_id, description, categories, keywords, contributor, is_adult, displayname, file_size, format, is_licensable, requested_date, filename, license_id) VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),?,?)', 
    [
        imageMetadata.shutterstock_id,
        imageMetadata.description,
        imageMetadata.categories,
        imageMetadata.keywords,
        imageMetadata.contributor,
        imageMetadata.is_adult,
        imageMetadata.displayname,
        imageMetadata.file_size,
        imageMetadata.format,
        imageMetadata.is_licensable,
        imageMetadata.filename,
        imageMetadata.license_id
    ]);
}

const insertImageEditorialMetadata = (imageMetadata) => {
    return db.query('INSERT INTO shutterstock_prueba (shutterstock_id, description, categories, keywords, displayname,  is_licensable, requested_date, filename, license_id) VALUES (?,?,?,?,?,?,NOW(),?,?)', 
    [
        imageMetadata.shutterstock_id,
        imageMetadata.description,
        imageMetadata.categories,
        imageMetadata.keywords,
        imageMetadata.displayname,
        imageMetadata.is_licensable,
        imageMetadata.filename,
        imageMetadata.license_id
    ]);
}

const getImageMetadata = (imageMetadataId) => {
    return db.query('SELECT *  FROM shutterstock_prueba WHERE shutterstock_id = ?', [imageMetadataId]);
}

module.exports = {
    insertImageCommercialMetadata,
    insertImageEditorialMetadata,
    getImageMetadata
}