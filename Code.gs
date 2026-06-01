/**
 * Google Apps Script for Employee KYC Form (Dedicated Aadhar + Optional ID proof)
 * 
 * Instructions:
 * 1. Open Google Sheets (create a new one or open an existing one).
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any code in the editor and paste this code.
 * 4. Click Save.
 * 5. Click "Deploy" -> "New deployment".
 * 6. Select Type: "Web app" and deploy.
 * 7. Update your .env file with the Web App URL.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // 10 seconds lock to prevent race conditions
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Check if sheet is empty and write headers if it is
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp", 
        "Full Name", 
        "Employee Code",
        "Email", 
        "Phone", 
        "Date of Birth", 
        "Gender", 
        // Permanent Address
        "Perm Street", "Perm Village", "Perm Post Office", "Perm City", "Perm Block", "Perm District", "Perm State",
        // Current Address
        "Curr Street", "Curr Village", "Curr Post Office", "Curr City", "Curr Block", "Curr District", "Curr State",
        // KYC Documents
        "Aadhar Number",
        "Aadhar Card Drive Link",
        "Other Document Type",
        "Other Document Number",
        "Other Document Drive Link",
        // Bank Details
        "Bank Account Holder", "Bank Name", "Account Number", "IFSC Code", 
        // Emergency Details
        "Emergency Contact Name", "Emergency Contact Relation", "Emergency Contact Phone"
      ];
      sheet.appendRow(headers);
    }
    
    // Parse incoming data
    var data = JSON.parse(e.postData.contents);
    
    // Upload files to Google Drive
    var aadharUrl = "";
    var otherDocUrl = "";
    var signatureUrl = "";
    
    // Create/Find folder in Drive for KYC uploads
    var folderName = "Employee_KYC_Documents";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    // Function to upload base64 file to Drive
    function uploadFile(base64Data, fileName, mimeType) {
      if (!base64Data) return "";
      
      var cleanBase64 = base64Data;
      if (base64Data.indexOf(",") > -1) {
        cleanBase64 = base64Data.split(",")[1];
      }
      
      var decodedBytes = Utilities.base64Decode(cleanBase64);
      var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
      var file = folder.createFile(blob);
      
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    }
    
    var sanitizedName = (data.fullName || "Employee").replace(/\s+/g, '_');
    
    // Upload Mandatory Aadhar
    if (data.aadharPhotoBase64) {
      aadharUrl = uploadFile(data.aadharPhotoBase64, sanitizedName + "_AadharCard", data.aadharPhotoType || "image/png");
    }
    
    // Upload Optional Other Document
    if (data.otherDocPhotoBase64) {
      var docType = (data.otherDocType || "OtherID").replace(/\s+/g, '_');
      otherDocUrl = uploadFile(data.otherDocPhotoBase64, sanitizedName + "_" + docType, data.otherDocPhotoType || "image/png");
    }
    

    
    // Prepare row data
    var row = [
      new Date(), // Timestamp
      data.fullName || "",
      data.employeeCode || "",
      data.email || "",
      data.phone || "",
      data.dob || "",
      data.gender || "",
      // Permanent Address
      data.permStreet || "",
      data.permVillage || "",
      data.permPostOffice || "",
      data.permCity || "",
      data.permBlock || "",
      data.permDistrict || "",
      data.permState || "",
      // Current Address
      data.currStreet || "",
      data.currVillage || "",
      data.currPostOffice || "",
      data.currCity || "",
      data.currBlock || "",
      data.currDistrict || "",
      data.currState || "",
      // KYC Docs
      data.aadharNumber || "",
      aadharUrl,
      data.otherDocType || "",
      data.otherDocNumber || "",
      otherDocUrl,
      // Bank & Emergency
      data.bankHolderName || "",
      data.bankName || "",
      data.accountNumber || "",
      data.ifscCode || "",
      data.emergencyName || "",
      data.emergencyRelation || "",
      data.emergencyPhone || ""
    ];
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "KYC data successfully saved." 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Enable CORS/preflight options request
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}
