import assert from "node:assert/strict";
import { test } from "node:test";
import { filterSifResult, hasSifError, repackSifResult, repackUglySifError } from "../lib/repack-sif-result.js";
import type { SIFCase, SIFCasesResponse, SIFOptions, SIFPrivatePersonResult, SIFRawResponse, SIFRecnoAndCaseNumberResponse } from "../types/sif.js";

type SIFError = SIFRawResponse & {
  hasError: true;
};

const repacker = <T>(sifResult: SIFRawResponse, options?: SIFOptions): T | SIFError => {
  if (hasSifError(sifResult)) {
    return { ...repackUglySifError(sifResult), hasError: true } as SIFError;
  }

  const result: T = repackSifResult(sifResult) as T;

  if (options) {
    return filterSifResult(result as T[], options) as T;
  }

  return result as T;
};

const resultPrivatePerson: SIFPrivatePersonResult[] | SIFError = repacker<SIFPrivatePersonResult[]>({
  ErrorDetails: null,
  ErrorMessage: null,
  PrivatePersons: [
    {
      Recno: 123456,
      FirstName: "Roger",
      LastName: "Hestefjes",
      PersonalIdNumber: "01010101010",
      ExternalID: "01010101010",
      PhoneNumber: null,
      MobilePhone: null,
      Email: null,
      Gender: null,
      Categories: [],
      CustomNo1: "",
      CustomNo2: "",
      CustomNo3: "",
      Active: true,
      CreatedDate: "2020-05-15T11:37:38",
      ModifiedDate: "2021-05-20T14:38:46",
      Title: "",
      AccessGroup: "",
      AdditionalFields: null,
      AlternativeEmail: null
    }
  ],
  Successful: true,
  TotalCount: 1,
  TotalPageCount: 1
});

const resultCreateCase: SIFRecnoAndCaseNumberResponse | SIFError = repacker<SIFRecnoAndCaseNumberResponse>({
  ErrorDetails: null,
  ErrorMessage: null,
  Recno: 123456,
  CaseNumber: "40/12345",
  Successful: true,
  TotalCount: 1,
  TotalPageCount: 1
});

const resultCreateCaseWithWeirdErrorMessage: SIFRecnoAndCaseNumberResponse | SIFError = repacker<SIFRecnoAndCaseNumberResponse>({
  ErrorDetails: null,
  ErrorMessage: "\n",
  Recno: 123456,
  CaseNumber: "40/12345",
  Successful: true,
  TotalCount: 1,
  TotalPageCount: 1
});

const getCase: SIFCasesResponse = {
  Cases: [
    {
      Recno: 123456,
      CaseNumber: "40/12345",
      ExternalId: null,
      Title: "Elevmappe",
      Date: "",
      Status: "Under behandling",
      AccessCodeDescription: "",
      AccessCodeCode: "",
      AccessGroup: "",
      Paragraph: "",
      ResponsibleEnterprise: {},
      ResponsibleEnterpriseName: "NYE VESTFOLD OG TELEMARK FYLKESKOMMUNE 01.01.2020 UNDER FORHÅNDSREGISTRERING",
      ResponsiblePerson: {},
      ResponsiblePersonName: "",
      ArchiveCodes: [],
      Documents: [],
      ReferringCases: null,
      ReferringDocuments: null,
      UnofficialTitle: "Elevmappe - Roger Hestefjes",
      CreatedDate: "",
      Notes: "",
      CaseTypeCode: "Elev",
      CaseTypeDescription: "Elev",
      Contacts: null,
      ProjectRecno: "",
      ProjectName: "",
      SubArchive: "4",
      SubArchiveCode: "Elev",
      CaseEstates: null,
      CaseRowPermissions: null,
      CustomFields: null,
      LastChangedDate: "",
      ProgressPlan: {},
      SubjectSpecificMetaData: null,
      SubjectSpecificMetaDataNamespace: null,
      URL: "https://arkivurl.vtfk.no:443"
    },
    {
      Recno: 123457,
      CaseNumber: "40/12346",
      ExternalId: null,
      Title: "Elevmappe",
      Date: "",
      Status: "Under behandling",
      AccessCodeDescription: "",
      AccessCodeCode: "",
      AccessGroup: "",
      Paragraph: "",
      ResponsibleEnterprise: {},
      ResponsibleEnterpriseName: "NYE VESTFOLD OG TELEMARK FYLKESKOMMUNE 01.01.2020 UNDER FORHÅNDSREGISTRERING",
      ResponsiblePerson: {},
      ResponsiblePersonName: "",
      ArchiveCodes: [],
      Documents: [],
      ReferringCases: null,
      ReferringDocuments: null,
      UnofficialTitle: "Elevmappe - Roger Hestefjes2",
      CreatedDate: "",
      Notes: "",
      CaseTypeCode: "Elev",
      CaseTypeDescription: "Elev",
      Contacts: null,
      ProjectRecno: "",
      ProjectName: "",
      SubArchive: "4",
      SubArchiveCode: "Elev",
      CaseEstates: null,
      CaseRowPermissions: null,
      CustomFields: null,
      LastChangedDate: "",
      ProgressPlan: {},
      SubjectSpecificMetaData: null,
      SubjectSpecificMetaDataNamespace: null,
      URL: "https://arkivurl.vtfk.no:443"
    },
    {
      Recno: 123458,
      CaseNumber: "40/12347",
      ExternalId: null,
      Title: "Elevmappe",
      Date: "",
      Status: "Under behandling",
      AccessCodeDescription: "",
      AccessCodeCode: "",
      AccessGroup: "",
      Paragraph: "",
      ResponsibleEnterprise: {},
      ResponsibleEnterpriseName: "NYE VESTFOLD OG TELEMARK FYLKESKOMMUNE 01.01.2020 UNDER FORHÅNDSREGISTRERING",
      ResponsiblePerson: {},
      ResponsiblePersonName: "",
      ArchiveCodes: [],
      Documents: [],
      ReferringCases: null,
      ReferringDocuments: null,
      UnofficialTitle: "Elevmappe - Roger Hestefjes3",
      CreatedDate: "",
      Notes: "",
      CaseTypeCode: "Elev",
      CaseTypeDescription: "Elev",
      Contacts: null,
      ProjectRecno: "",
      ProjectName: "",
      SubArchive: "4",
      SubArchiveCode: "Elev",
      CaseEstates: null,
      CaseRowPermissions: null,
      CustomFields: null,
      LastChangedDate: "",
      ProgressPlan: {},
      SubjectSpecificMetaData: null,
      SubjectSpecificMetaDataNamespace: null,
      URL: "https://arkivurl.vtfk.no:443"
    }
  ],
  ErrorDetails: null,
  ErrorMessage: null,
  Successful: true,
  TotalCount: 1,
  TotalPageCount: 1
};

const resultCreateCaseWithErrorMessage: SIFError = repacker<SIFError>({
  ErrorDetails: null,
  ErrorMessage: "Error occured in the mainframe :-O",
  Recno: 123456,
  CaseNumber: "40/12345",
  Successful: true,
  TotalCount: 1,
  TotalPageCount: 1
});

const resultCreateCaseWithErrorMessageFromP360: SIFError = repacker<SIFError>({
  ErrorDetails: null,
  ErrorMessage:
    'Error sending object CreateDocumentTransaction () to receiver SI.Data._360.Receivers.Transaction.CreateDocumentReceiver (C:\\Program Files (x86)\\Tieto\\360\\_instances\\VTFKTEST\\webservices\\SI.WS.Core\\bin\\SI.Data.360.dll): System.Exception: Error executing statement: (($((#A8BA4524-35CF-4DE3-81EC-E0AF987E89CD#))*Access Group is not a valid for the entity and subtype. AccessGroup=$))\'200693\'\n<operation><INSERTSTATEMENT ENTITY="Document" ID="b05bb485-accd-4c09-af00-88dfa73f8732" NAMESPACE="SIRIUS"><METAITEM NAME="ToCase"><VALUE>234464</VALUE></METAITEM><METAITEM NAME="Title"><VALUE>Kort spørsmål: Hva er status for alkoholdservering på fylkeskommunens regning?</VALUE></METAITEM><METAITEM NAME="UnofficialTitle"><VALUE>Kort spørsmål: Hva er status for alkoholdservering på fylkeskommunens regning?</VALUE></METAITEM><METAITEM NAME="ToDocumentArchive"><VALUE>2</VALUE></METAITEM><METAITEM NAME="ToDocumentCategory"><VALUE>60005</VALUE></METAITEM><METAITEM NAME="ToJournalStatus"><VALUE>6</VALUE></METAITEM><METAITEM NAME="ToOrgUnit"><VALUE>237034</VALUE></METAITEM><METAITEM NAME="ToAuthorization"><VALUE>Offl. § 14</VALUE></METAITEM><METAITEM NAME="ToAccessCode"><VALUE>200003</VALUE></METAITEM><METAITEM NAME="ToAccessGroup"><VALUE>200693</VALUE></METAITEM><METAITEM NAME="DocumentDate"><VALUE>22.11.2021 00:00:00</VALUE></METAITEM><METAITEM NAME="Paper"><VALUE>0</VALUE></METAITEM><METAITEM NAME="Recno"><VALUE>[PLACEHOLDER(163efccc-6077-4617-ad0f-0621dbe365f0,Document)]</VALUE></METAITEM></INSERTSTATEMENT><BATCH ID="b05bb485-accd-4c09-af00-88dfa73f8732"><INSERTSTATEMENT ENTITY="Version" ID="86a399ea-e278-4580-9f25-58cf7436e81f" NAMESPACE="SIRIUS" /><BATCH ID="86a399ea-e278-4580-9f25-58cf7436e81f" /></BATCH></operation> ---> SI.Util.BizInfoException: (($((#A8BA4524-35CF-4DE3-81EC-E0AF987E89CD#))*Access Group is not a valid for the entity and subtype. AccessGroup=$))\'200693\'\r\n   at SI.Biz.Core.AccessGroup.AccessGroupValidation.ValidateAccessGroupForEntityAndSubtype(String entity, Int32 entitysubtype, Int32 accessgroup)\r\n   at SI.Biz.Core.Document.DocumentMetaHandler.ValidateAccessGroupValue()\r\n   at SI.Biz.Core.Document.DocumentMetaInsert.ValidateAccessGroup()\r\n   at SI.Biz.Core.MetaExecution.MetaManager.ExecuteValidation(Action action, enumValidationType validationtype)\r\n   at SI.Biz.Core.Document.DocumentMetaInsert.Validate()\r\n   at SI.Biz.Core.MetaExecution.MetaManager.InternalValidate()\r\n   at SI.Biz.Core.MetaExecution.MetaOperationManager.<>c.<RunValidateOnOperationTree>b__19_0(MetaManager x, MetaOperation o)\r\n   at SI.Biz.Core.MetaExecution.MetaOperationManager.RunOperationFunctionOnManagers(IList`1 managers, MetaOperation operation, ManagerOperationFunction func)\r\n   at SI.Biz.Core.MetaExecution.MetaOperationManager.RunManagerOnOperationTree(MetaOperation operation, ManagerOperationFunction func)\r\n   at SI.Biz.Core.MetaExecution.MetaOperationManager.RunOperations(Boolean skipValidation, Boolean skipAccessControl)\r\n   at SI.Biz.Core.MetaActionOperation.ExecuteSingleAction(String xmlOpr)\r\n   at SI.Data._360._360AppFabricAdapter.ExecuteAction(String statement, Boolean single, Boolean skipValidation, Boolean skipAccessControl) in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Adapters\\360AppFabricAdapter.cs:line 204\r\n   --- End of inner exception stack trace ---\r\n   at SI.Data._360._360AppFabricAdapter.ExecuteAction(String statement, Boolean single, Boolean skipValidation, Boolean skipAccessControl) in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Adapters\\360AppFabricAdapter.cs:line 241\r\n   at SI.Data._360._360AppFabricAdapter.MetaInsert(String insertStatement, Boolean skipValidation) in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Adapters\\360AppFabricAdapter.cs:line 81\r\n   at SI.Data._360._360AppFabricAdapter.MetaInsert(MetaStatement insertStatement, Boolean skipValidation) in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Adapters\\360AppFabricAdapter.cs:line 71\r\n   at SI.Data._360.Operations.DocumentOperation.Insert() in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Operations\\Common\\DocumentOperation.cs:line 52\r\n   at SI.Data._360.Operations.Transaction.InsertDocumentTransactionOperation.Insert() in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Operations\\Transaction\\InsertDocumentTransactionOperation.cs:line 24\r\n   at SI.Data._360.Receivers.Transaction.CreateDocumentReceiver.DoTransaction() in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Receivers\\Transaction\\CreateDocumentReceiver.cs:line 17\r\n   at SI.Data._360.Receivers.Transaction.TransactionObjectReceiverBase`1.<>c__DisplayClass3_0.<ReceiveInternal>b__0() in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Receivers\\Transaction\\TransactionObjectReceiverBase.cs:line 42\r\n   at SI.Data._360.Utils.TransactionHelper.RunInTransaction(Action action) in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Utils\\TransactionHelper.cs:line 48\r\n   at SI.Data._360.Receivers.Transaction.TransactionObjectReceiverBase`1.ReceiveInternal() in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Receivers\\Transaction\\TransactionObjectReceiverBase.cs:line 47\r\n   at SI.Data._360.Receivers.ReceiverBase`1.Receive() in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.360\\Receivers\\ReceiverBase.cs:line 61\r\n   at SI.Data.DataDispatcher.DispatchObjectToPlugin(ISIDataObject dataObject, Object plugin) in d:\\a\\1\\s\\Source\\SI.Data\\SI.Data.Core\\DataDispatcher.cs:line 345',
  Recno: 123456,
  CaseNumber: "40/12345",
  Successful: true,
  TotalCount: 1,
  TotalPageCount: 1
});

const resultPrivatePersonWithEmptyResponse: SIFPrivatePersonResult[] | SIFError = repacker<SIFPrivatePersonResult[]>({
  PrivatePersons: [],
  TotalPageCount: 0,
  TotalCount: 0,
  Successful: true,
  ErrorMessage: null,
  ErrorDetails: null
});

test("PrivatePerson result is Array", () => {
  assert.equal("hasError" in resultPrivatePerson, false);
  assert.equal(Array.isArray(resultPrivatePerson), true);
});

test("PrivatePerson result has one item only", () => {
  assert.equal("hasError" in resultPrivatePerson, false);
  assert.deepEqual(Object.getOwnPropertyNames(resultPrivatePerson), ["0", "length"]);
});

test('PrivatePerson results one item has a "Recno" property', () => {
  assert.equal("hasError" in resultPrivatePerson, false);
  assert.equal(resultPrivatePerson[0].Recno, 123456);
});

test("PrivatePerson with empty response is array", () => {
  assert.equal("hasError" in resultPrivatePersonWithEmptyResponse, false);
  assert.equal(Array.isArray(resultPrivatePersonWithEmptyResponse), true);
});

test("PrivatePerson with empty response is empty array", () => {
  assert.equal("hasError" in resultPrivatePersonWithEmptyResponse, false);
  assert.equal(resultPrivatePersonWithEmptyResponse.length, 0);
});

test("CreateCase result is object and has property CaseNumber", () => {
  assert.equal("hasError" in resultCreateCase, false);
  assert.equal(typeof resultCreateCase, "object");
  assert.ok(resultCreateCase.CaseNumber);
});

test('CreateCase results one item has a "Recno" and a "CaseNumber" property', () => {
  assert.equal("hasError" in resultCreateCase, false);
  assert.equal(resultCreateCase.Recno, 123456);
  assert.equal(resultCreateCase.CaseNumber, "40/12345");
});

test("GetCase result with limit set to 1 is returned as Object", () => {
  const result: SIFCase | SIFError = repacker<SIFCase>(getCase as SIFRawResponse, { limit: 1 });
  assert.equal("hasError" in result, false);
  assert.equal(typeof result, "object");
  assert.equal(result.Recno, 123456);
  assert.equal(result.CaseNumber, "40/12345");
});

test("GetCase result with limit set to 2 is returned as Array with 2 items", () => {
  const result: SIFCase[] | SIFError = repacker<SIFCase[]>(getCase as SIFRawResponse, { limit: 2 });
  assert.equal("hasError" in result, false);
  assert.equal(Array.isArray(result), true);
  assert.equal(result.length, 2);
  assert.equal(result[0].Recno, 123456);
  assert.equal(result[0].CaseNumber, "40/12345");
  assert.equal(result[1].Recno, 123457);
  assert.equal(result[1].CaseNumber, "40/12346");
});

test("GetCase result with limit set to 5 is returned as Array with 3 items", () => {
  const result: SIFCase[] | SIFError = repacker<SIFCase[]>(getCase as SIFRawResponse, { limit: 5 });
  assert.equal("hasError" in result, false);
  assert.equal(Array.isArray(result), true);
  assert.equal(result.length, 3);
  assert.equal(result[0].Recno, 123456);
  assert.equal(result[0].CaseNumber, "40/12345");
  assert.equal(result[1].Recno, 123457);
  assert.equal(result[1].CaseNumber, "40/12346");
  assert.equal(result[2].Recno, 123458);
  assert.equal(result[2].CaseNumber, "40/12347");
});

test("GetCase result with limit not set is returned as Array with 3 items", () => {
  const result: SIFCase[] | SIFError = repacker<SIFCase[]>(getCase as SIFRawResponse);
  assert.equal("hasError" in result, false);
  assert.equal(Array.isArray(result), true);
  assert.equal(result.length, 3);
  assert.equal(result[0].Recno, 123456);
  assert.equal(result[0].CaseNumber, "40/12345");
  assert.equal(result[1].Recno, 123457);
  assert.equal(result[1].CaseNumber, "40/12346");
  assert.equal(result[2].Recno, 123458);
  assert.equal(result[2].CaseNumber, "40/12347");
});

test("CreateCase result with ErrorMessage is Object", () => {
  assert.equal("ErrorMessage" in resultCreateCaseWithErrorMessage, true);
  assert.equal("hasError" in resultCreateCaseWithErrorMessage, true);
  assert.equal(typeof resultCreateCaseWithErrorMessage, "object");
});

test("CreateCase result with ErrorMessage is caught as error", () => {
  assert.equal("ErrorMessage" in resultCreateCaseWithErrorMessage, true);
  assert.equal("hasError" in resultCreateCaseWithErrorMessage, true);
  assert.equal(resultCreateCaseWithErrorMessage.hasError, true);
});

test('CreateCase result with ErrorMessage has a "ErrorMessage" property', () => {
  assert.equal("ErrorMessage" in resultCreateCaseWithErrorMessage, true);
  assert.equal("hasError" in resultCreateCaseWithErrorMessage, true);
  assert.equal(typeof resultCreateCaseWithErrorMessage.ErrorMessage, "string");
  assert.equal(resultCreateCaseWithErrorMessage.ErrorMessage, "Error occured in the mainframe :-O");
});

test('CreateCase result with ErrorMessage newline do have "ErrorMessage" property but do not have "hasError" property', () => {
  assert.equal("ErrorMessage" in resultCreateCaseWithWeirdErrorMessage, true);
  assert.equal("hasError" in resultCreateCaseWithWeirdErrorMessage, false);
  assert.equal(resultCreateCaseWithWeirdErrorMessage.Recno, 123456);
  assert.equal(resultCreateCaseWithWeirdErrorMessage.CaseNumber, "40/12345");
});

test("CreateCase result with ErrorMessage from P360 do not have quotes inside", () => {
  assert.equal("ErrorMessage" in resultCreateCaseWithErrorMessageFromP360, true);
  assert.equal("hasError" in resultCreateCaseWithErrorMessageFromP360, true);
  assert.equal(resultCreateCaseWithErrorMessageFromP360.ErrorMessage?.indexOf('"'), -1);
  assert.equal(resultCreateCaseWithErrorMessageFromP360.ErrorMessage?.indexOf("'"), -1);
});
