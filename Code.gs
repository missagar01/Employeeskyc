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

    // Default header order - only used when the sheet is empty (first run)
    var defaultHeaders = [
      "Timestamp",
      "Full Name",
      "Father's Name",
      "Employee Code",
      "Department",
      "Designation",
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
      "Aadhar Front Drive Link",
      "Aadhar Back Drive Link",
      "Other Document Type",
      "Other Document Number",
      "Other Document Drive Link",
      // Bank Details
      "Bank Account Holder", "Bank Name", "Account Number", "IFSC Code",
      // Emergency Details
      "Emergency Contact Name", "Emergency Contact Relation", "Emergency Contact Phone"
    ];

    // Check if sheet is empty and write headers if it is
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(defaultHeaders);
    }

    // Always read the ACTUAL headers currently in row 1, in their current
    // left-to-right order. If someone reorders/inserts columns in the sheet,
    // this reflects that new order instead of assuming the default one.
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Parse incoming data
    var data = JSON.parse(e.postData.contents);
    
    // Upload files to Google Drive
    var aadharFrontUrl = "";
    var aadharBackUrl = "";
    var otherDocUrl = "";
    
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
    
    // Upload Mandatory Aadhar Front
    if (data.aadharFrontPhotoBase64) {
      aadharFrontUrl = uploadFile(data.aadharFrontPhotoBase64, sanitizedName + "_AadharFront", data.aadharFrontPhotoType || "image/png");
    }
    
    // Upload Mandatory Aadhar Back
    if (data.aadharBackPhotoBase64) {
      aadharBackUrl = uploadFile(data.aadharBackPhotoBase64, sanitizedName + "_AadharBack", data.aadharBackPhotoType || "image/png");
    }
    
    // Upload Optional Other Document
    if (data.otherDocPhotoBase64) {
      var docType = (data.otherDocType || "OtherID").replace(/\s+/g, '_');
      otherDocUrl = uploadFile(data.otherDocPhotoBase64, sanitizedName + "_" + docType, data.otherDocPhotoType || "image/png");
    }
    
    // Map of header name -> value. Keys must match the header text exactly
    // (see defaultHeaders above). This is looked up by NAME, not position,
    // so reordering/inserting columns in the sheet won't misalign data.
    var valueByHeader = {
      "Timestamp": new Date(),
      "Full Name": data.fullName || "",
      "Father's Name": data.fatherName || "",
      "Employee Code": data.employeeCode || "",
      "Department": data.department || "",
      "Designation": data.designation || "",
      "Email": data.email || "",
      "Phone": data.phone || "",
      "Date of Birth": data.dob || "",
      "Gender": data.gender || "",
      // Permanent Address
      "Perm Street": data.permStreet || "",
      "Perm Village": data.permVillage || "",
      "Perm Post Office": data.permPostOffice || "",
      "Perm City": data.permCity || "",
      "Perm Block": data.permBlock || "",
      "Perm District": data.permDistrict || "",
      "Perm State": data.permState || "",
      // Current Address
      "Curr Street": data.currStreet || "",
      "Curr Village": data.currVillage || "",
      "Curr Post Office": data.currPostOffice || "",
      "Curr City": data.currCity || "",
      "Curr Block": data.currBlock || "",
      "Curr District": data.currDistrict || "",
      "Curr State": data.currState || "",
      // KYC Docs
      "Aadhar Number": data.aadharNumber || "",
      "Aadhar Front Drive Link": aadharFrontUrl,
      "Aadhar Back Drive Link": aadharBackUrl,
      "Other Document Type": data.otherDocType || "",
      "Other Document Number": data.otherDocNumber || "",
      "Other Document Drive Link": otherDocUrl,
      // Bank & Emergency
      "Bank Account Holder": data.bankHolderName || "",
      "Bank Name": data.bankName || "",
      "Account Number": data.accountNumber || "",
      "IFSC Code": data.ifscCode || "",
      "Emergency Contact Name": data.emergencyName || "",
      "Emergency Contact Relation": data.emergencyRelation || "",
      "Emergency Contact Phone": data.emergencyPhone || ""
    };

    // Build the row in the SAME order as the sheet's actual current headers.
    // Any header not recognized (e.g. a manually added extra column) is left blank.
    var row = headers.map(function (headerName) {
      return valueByHeader.hasOwnProperty(headerName) ? valueByHeader[headerName] : "";
    });

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
