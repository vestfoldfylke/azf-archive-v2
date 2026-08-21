import { logger } from "@vestfoldfylke/loglady";
import { GENERATED_PDF_PROPERTY_NAME } from "../config.js";
import type { CallArchiveTemplateInput } from "../types/sif.js";
import type { ArchivePayload, PdfPayload, Template, ValidatedTemplateResponse } from "../types/template.js";
import callArchive from "./call-archive.js";
import generatePdf from "./generate-pdf.js";
import HTTPError from "./http-error.js";
import validateTemplateData from "./validate-templatedata.js";

type ArchivePayloadFileAttachment = {
  Base64Data: string;
  Format: string;
  Status: "F";
  Title: string;
  VersionFormat: string;
};

type ArchivePayloadContact = {
  Role: string;
  ReferenceNumber?: string;
  ExternalId?: string;
  IsUnofficial?: boolean;
};

type DocumentAttachment = {
  base64: string;
  format: string;
  title: string;
  versionFormat?: string;
};

type DocumentContact = {
  ssn: string;
  externalId: string;
  recno: string;
  role: string;
  isUnofficial?: boolean;
  privatePersonRecno?: string;
  enterpriseRecno?: string;
  contactPersonRecno?: string;
};

const validAttachmentServices: string[] = ["DocumentService"];
const validAttachmentMethods: string[] = ["CreateDocument", "UpdateDocument"];

const validContactServices: string[] = ["DocumentService", "CaseService", "ProjectService"];
const validContactMethods: string[] = ["CreateDocument", "UpdateDocument", "CreateCase", "UpdateCase", "CreateProject", "UpdateProject"];

const addAttachments = (archivePayload: ArchivePayload, attachments: DocumentAttachment[]): ArchivePayload => {
  if (!validAttachmentServices.includes(archivePayload.service)) {
    throw new Error(`Adding attachment is only allowed in services: '${validAttachmentServices.toString()}'. This template is using service: '${archivePayload.service}'. Why are you doing this??`);
  }
  if (!validAttachmentMethods.includes(archivePayload.method)) {
    throw new Error(`Adding attachment is only allowed in methods: '${validAttachmentMethods.toString()}'. This template is using method: '${archivePayload.method}'. Why are you doing this??`);
  }

  for (const attachment of attachments) {
    if (!attachment.title) {
      throw new Error('Missing required parameter in attachment object "attachment.title"');
    }
    if (!attachment.format) {
      throw new Error('Missing required parameter in attachment object "attachment.format"');
    }
    if (!attachment.base64) {
      throw new Error('Missing required parameter in attachment object "attachment.base64"');
    }

    if (!archivePayload.parameter.Files) {
      archivePayload.parameter.Files = [];
    }

    (archivePayload.parameter.Files as ArchivePayloadFileAttachment[]).push({
      Base64Data: attachment.base64,
      Format: attachment.format,
      Status: "F",
      Title: attachment.title,
      VersionFormat: attachment.versionFormat || "P"
    });
  }

  return archivePayload;
};

const addContacts = (archivePayload: ArchivePayload, contacts: DocumentContact[]): ArchivePayload => {
  if (!validContactServices.includes(archivePayload.service)) {
    throw new Error(`Adding contacts is only allowed in services: '${validContactServices.toString()}'. This template is using service: '${archivePayload.service}'. Why are you doing this?? :(`);
  }
  if (!validContactMethods.includes(archivePayload.method)) {
    throw new Error(`Adding contacts is only allowed in methods: '${validContactMethods.toString()}'. This template is using method: '${archivePayload.method}'. Why are you doing this?? :(`);
  }

  for (const contact of contacts) {
    if (!contact.ssn && !contact.externalId && !contact.recno) {
      throw new Error('Missing required parameter in contact object "contact.ssn" or "contact.externalId" or "contact.recno');
    }
    if (!contact.role) {
      throw new Error('Missing required parameter in contact object "contact.role"');
    }

    if (!archivePayload.parameter.Contacts) {
      archivePayload.parameter.Contacts = [];
    }

    const contactObj: ArchivePayloadContact = { Role: contact.role };

    if (contact.privatePersonRecno) {
      contactObj.ReferenceNumber = `recno:${contact.privatePersonRecno}`;
    } else if (contact.enterpriseRecno) {
      contactObj.ReferenceNumber = `recno:${contact.enterpriseRecno}`;
    } else if (contact.contactPersonRecno) {
      contactObj.ExternalId = `recno:${contact.contactPersonRecno}`;
    } else if (contact.ssn) {
      contactObj.ReferenceNumber = contact.ssn;
    } else if (contact.externalId) {
      contactObj.ExternalId = contact.externalId;
    }

    if (contact.isUnofficial) {
      contactObj.IsUnofficial = true;
    }

    (archivePayload.parameter.Contacts as ArchivePayloadContact[]).push(contactObj);
  }

  return archivePayload;
};

export default async (archiveData: CallArchiveTemplateInput): Promise<unknown> => {
  const { system, template, parameter, getExample, demoRun } = archiveData;
  let templateFile: Template;
  try {
    templateFile = require(`../templates/${system}/${template}`);
  } catch {
    throw new HTTPError(400, `Could not find any template for system: "${system}" with name "${template}", are you sure it exists?`);
  }

  const { pdfTemplate, archiveTemplate, requiredFields, optionalFields } = templateFile;
  if (!archiveTemplate) {
    throw new HTTPError(500, `Template "${system}-${template}" have not been set up with an "archiveTemplate" function, please contact API-responsible`);
  }
  if (!requiredFields) {
    throw new HTTPError(500, `Template "${system}-${template}" have not been set up with required object "requiredFields", please contact API-responsible`);
  }

  // If user only wants a sample request
  if (getExample) {
    const templateFields = JSON.parse(JSON.stringify(requiredFields));
    if (optionalFields && typeof optionalFields === "object") {
      for (const [key, value] of Object.entries(optionalFields)) {
        templateFields[`${key} (OPTIONAL)`] = value;
      }
    }
    return { system, template, parameter: templateFields };
  }

  const validTemplateData: ValidatedTemplateResponse = validateTemplateData(requiredFields, parameter, system, template);
  if (!validTemplateData.valid) {
    throw new HTTPError(400, 'Provided data in "parameter" is not valid - Tip: Set property "getExample" to true, to receive example payload', validTemplateData.errorProperties);
  }

  // Check if we need to create a pdf as well
  if (pdfTemplate) {
    logger.info("O-lala, we have a pdf-template - lets generate the pdf");
    const pdfData: PdfPayload = pdfTemplate(parameter);
    parameter[GENERATED_PDF_PROPERTY_NAME] = await generatePdf(pdfData);
    logger.info("pdf generated");
  }

  let archivePayload: ArchivePayload = archiveTemplate(parameter);

  // Add attachments and contacts if needed
  if (parameter.attachments) {
    archivePayload = addAttachments(archivePayload, parameter.attachments as DocumentAttachment[]);
  }
  if (parameter.contacts) {
    archivePayload = addContacts(archivePayload, parameter.contacts as DocumentContact[]);
  }

  // Sanitize some stuff
  if (archivePayload.parameter?.Files) {
    (archivePayload.parameter.Files as ArchivePayloadFileAttachment[]).map((file: ArchivePayloadFileAttachment) => {
      file.Title = file.Title.replace(/"/g, "'").replace(/[<>]/g, ""); // SIF håndterer ikke escaped characters i filnavn - får Illegal character in path, derav denne fiksen
      return file;
    });
  }

  // If user only wants to do a demo run
  if (demoRun) {
    return archivePayload;
  }

  return await callArchive(archivePayload);
};
