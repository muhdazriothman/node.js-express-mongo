'use strict';

const debug = require('debug')('lib:metadata');
const util = require('util');
const db = require('@newspage/lib-commons/db');
// const camelCase = require('camelcase');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const { getId, getBytesFromRawStringId, getPrettyStringFromBytesId, getBytesFromPrettyStringId, getRawStringFromBytesId } = require('@newspage/lib-commons/ident');
const ctx = require('@newspage/lib-commons/ctx');
const { NotFoundError } = require('./api-error');
const { metaModule } = require('@newspage/lib-metadata');
const logger = require('@newspage/lib-commons/logger')('services:deleteSalesCalendar');
util.inspect.defaultOptions.breakLength = Infinity;
util.inspect.defaultOptions.depth = Infinity;

class ModuleSetting {
  constructor(obj) {
    this.Id = obj.ID;
    this.tenantId = obj.TENANT_ID;
    this.Title = obj.TITLE;
    this.Description = obj.DESCRIPTION;
    this.logicalId = obj.LOGICAL_ID;
    this.logicaluuId = obj.LOGICAL_UUID;
    this.serviceName = obj.SERVICE_NAME;
    this.serviceVersion = obj.SERVICE_VERSION;
    this.isDeleted = obj.IS_DELETED ? true : false;
    this.version = obj.VERSION;
  }
}

class MetadataFields {
  constructor(obj) {
    this.Id = obj.ID;
    this.label = obj.LABEL;
    this.field = obj.FIELD;
    this.type = obj.TYPE;
    this.displayType = obj.DISPLAY_TYPE;
    this.orderSeq = obj.ORDER_SEQ;
    this.editable = obj.ISEDITABLE;

    if (obj.FILTERABLE && obj.FILTERABLE.length > 0) {
      this.filterable = JSON.parse(obj.FILTERABLE.trim());
    }
    if (obj.DISPLAYABLE && obj.DISPLAYABLE.length > 0) {
      this.displayable = JSON.parse(obj.DISPLAYABLE.trim());
    }
    this.validations = {};
    if (obj.VALIDATION && obj.VALIDATION.length > 0) {
      this.validations = JSON.parse(obj.VALIDATION.trim());
    }
    if (obj.OPTION_VALUES && obj.OPTION_VALUES.length > 0) {
      this.values = JSON.parse(obj.OPTION_VALUES.trim());
    }

    this.reflogicalId = obj.REF_LOGICAL_ID;
    this.refdisplayField = obj.REF_DISPLAY_FIELD;
    this.refFilter = obj.REF_FILTER;
  }
}

class MetadataActions {
  constructor(obj) {
    this.label = obj.TITLE;
    this.name = obj.NAME;
    this.description = obj.DESCRIPTION;
    this.displayType = obj.DISPLAY_TYPE;
    this.icon = obj.ICON;
    this.behavior = obj.BEHAVIOUR;
    this.content = obj.CONTENT;
    this.orderSeq = obj.ORDER_SEQ;
  }
}

const metadata = {

  async getUserTenantInfo() {
    const userInfo = ctx.getUserInfo();

    if (userInfo) {
      return userInfo.tenantId;
    } else {
      return null;
    }
  },

  async getModule(tenantId, moduleName) {
    try {
      const sqlQuery = `
      SELECT CAST(A.ID AS varchar(5000)) AS "ID",
          A.TITLE, 
          A.DESCRIPTION,
          A.LOGICAL_ID,
					A.SERVICE_NAME, 
					A.SERVICE_VERSION, 
					A.START_DATE, 
					A.END_DATE, 
					A.IS_DELETED,
          A.MODIFIED_DATE,
          A.MODIFIED_BY,
          A.CREATED_DATE,
          A.CREATED_BY,
					A.VERSION
			FROM METADATA_MODULE AS A
			WHERE A.LOGICAL_ID = $1 AND IS_DELETED = false;`;
      const results = await db.submit(sqlQuery, [moduleName]);
      if (results.length === 0) {
        return;
      } else if (results.length > 1) {
        throw new Error(`Unexpected result set length retrieving info for module: '${moduleName}'`);
      } else {
        //return results[0].ID;
        return new ModuleSetting(results[0]);
      }
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },

  async getValuesByDistId(tenantId, moduleId, distId, returnFields) {
    try {
      const sqlQuery = `
			SELECT 
      CAST(A.ID AS varchar(5000)) AS "ID",
        B.ID AS FIELD_ID,
        B.FIELD,
        B.TYPE,
        C.FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1
			AND A.ID IN
			(
				SELECT tblA.ID 
				FROM
				(
						SELECT A.ID,
							   B.MODULE_ID
						FROM MODULE_DATA_ROWS A 
						LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID AND A.IS_DELETED != true OR A.IS_DELETED IS NULL
			      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
						WHERE A.MODULE_ID = $1
						AND B.FIELD = 'DIST_ID' AND TO_VARCHAR(C.FIELD_VALUE) = $2
				)tblA 
				LEFT OUTER JOIN METADATA_FIELD E ON E.MODULE_ID = tblA.MODULE_ID
				LEFT OUTER JOIN MODULE_DATA_FIELDS F ON F.ROW_ID = tblA.ID AND F.FIELD_ID = E.ID
				--WHERE E.OBJECT_FIELD_NAME = 'SYNCOPERATION' AND TO_VARCHAR(F.FIELD_VALUE) != 'D'
			)
			ORDER BY B.ORDER_SEQ ASC`;
      const results = await db.submit(sqlQuery, [moduleId, distId]);
      if (results.length > 0) {
        let fieldValueRecords = [];
        let rowIds = [];
        for (const result of results) {
          rowIds.push(result.ID);
        }
        let uniqueRowIds = [...new Set(rowIds)];
        for (const rowId of uniqueRowIds) {
          let record = {};
          for (const result of results) {
            if (result.ID === rowId) {
              let fieldName = result.FIELD; //camelCase(result.OBJECT_FIELD_NAME);
              if ((returnFields == null) || (Array.isArray(returnFields) && returnFields.length > 0 && returnFields == fieldName)) {
                record[fieldName] = _mapColumns(result.TYPE, result.FIELD_VALUE);
              }
            }
          }
          fieldValueRecords.push(record);
        }
        return fieldValueRecords;
      } else
        return;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },

  async getActions(moduleId) {
    try {
      const sqlQuery = `
			SELECT 
				ACTION_TITLE,
				ACTION_NAME,
				ACTION_DESC,	
				ACTION_DISPLAY_TYPE,
				ACTION_ICON,
				ACTION_BEHAVIOUR,
				ACTION_CONTENT,
				ORDER_SEQ
			FROM CORE_MODULE_ACTIONS
			WHERE MODULE_ID = $1`;

      const results = await db.submit(sqlQuery, [moduleId]);

      const metadataActionsRecords = [];
      for (const result of results) {
        metadataActionsRecords.push(new MetadataActions(result));
      }
      return metadataActionsRecords;

    } catch (err) {
      debug(`Error occured when retrieving metadata actions ${util.inspect(err)}`);
      throw err;
    }
  },

  async getFields(tenantId, moduleId) {
    try {
      const sqlQuery = `
			SELECT CAST(A.ID AS varchar(5000)) AS "ID", 
        A.LABEL,
        A.DESCRIPTION,
				A.FIELD,
				A.TYPE,
        A.DISPLAY_TYPE,
        A.ORDER_SEQ,
				A.VALIDATION,
			  A.DISPLAYABLE, 
				A.FILTERABLE, 
				A.TOOLTIP, 
        A.OPTION_VALUES,
        A.REF_MODULE_ID,
        A.REF_DISPLAY_FIELD,
        A.REF_FILTER
			FROM METADATA_FIELD A 
			WHERE A.MODULE_ID = $2 
			ORDER BY A.ORDER_SEQ ASC`;
      const results = await db.submit(sqlQuery, [tenantId, moduleId]);
      const metadataFieldsRecords = [];
      for (const result of results) {
        metadataFieldsRecords.push(new MetadataFields(result));
      }
      console.log(metadataFieldsRecords);
      return metadataFieldsRecords;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },

  async getRowId(tenantId, moduleId, pkValue) {
    try {
      const sqlQuery = `
			SELECT CAST(A.ROW_ID AS varchar(5000)) AS "ROW_ID" 
			FROM MODULE_DATA_FIELDS A
			INNER JOIN MODULE_DATA_ROWS B ON B.ID = A.ROW_ID AND B.MODULE_ID = $1
      INNER JOIN METADATA_FIELD C ON C.MODULE_ID = B.MODULE_ID AND C.ID = A.FIELD_ID AND C.TYPE = 'id'
			WHERE CAST(A.FIELD_VALUE AS VARCHAR) = $2;`;
      const results = await db.submit(sqlQuery, [moduleId, pkValue]);
      if (results.length > 0) {
        return results[0].ROW_ID;
      }
      return pkValue;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields row id ${util.inspect(err)}`);
      throw err;
    }
  },

  async getPK(moduleId) {
    try {
      const sqlQuery = `
			SELECT FIELD
			FROM METADATA_FIELD 
      WHERE MODULE_ID = $1 AND TYPE = 'id';`;
      const results = await db.submit(sqlQuery, [moduleId]);
      if (results.length > 0) {
        return results[0].FIELD;
      }
      return;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields primary key field name ${util.inspect(err)}`);
      throw err;
    }
  },

  async getValuesByCode(tenantId, moduleId, fieldsCd, returnFields, orderByField, rowId) {
    try {
      let condition = '';

      let conditionOrderByField = '';
      let conditionOrderBy = '';
      let values = [moduleId, fieldsCd];

      if (rowId) {
        condition = `AND  CAST(A.ID AS varchar(5000)) = '${rowId}'`;
      }
      if (orderByField) {
        conditionOrderByField = `
        LEFT JOIN (SELECT ROW_NUMBER() OVER(ORDER BY CAST(MDF.FIELD_VALUE AS varchar(5000)) ASC) AS Row#, MDF.ROW_ID, CAST(MDF.FIELD_VALUE AS varchar(5000))
    		FROM METADATA_FIELD MF 
    		INNER JOIN MODULE_DATA_FIELDS MDF ON MDF.FIELD_ID = MF.ID 
        WHERE MF.MODULE_ID = $1 AND MF.FIELD = $3) G ON G.ROW_ID = A.ID`;

        conditionOrderBy = `,G.Row#, A.ID`;
        values = [moduleId, fieldsCd, orderByField];
      }

      const sqlQuery = `
      SELECT 
      CAST(A.ID AS varchar(5000)) AS "ID",
        B.ID AS FIELD_ID,
        B.FIELD,
        B.TYPE,
        C.FIELD_VALUE
      FROM MODULE_DATA_ROWS A 
      LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID 
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID =  A.ID  AND C.FIELD_ID = B.ID
      INNER JOIN (SELECT DISTINCT E.ROW_ID FROM MODULE_DATA_FIELDS E WHERE CAST(E.FIELD_VALUE AS varchar(5000)) = $2) F ON F.ROW_ID = A.ID 
      ${conditionOrderByField}
      WHERE A.MODULE_ID = $1 ${condition}
      AND (A.IS_DELETED != true OR A.IS_DELETED IS NULL)
      ORDER BY B.ORDER_SEQ ${conditionOrderBy} ASC;`;
      const results = await db.submit(sqlQuery, values);
      let fieldValueRecords = [];
      let rowIds = [];
      for (const result of results) {
        rowIds.push(result.ID);
      }
      let uniqueRowIds = [...new Set(rowIds)];
      for (const rowId of uniqueRowIds) {
        let record = {};
        for (const result of results) {
          if (result.ID === rowId) {
            let fieldName = result.FIELD; //camelCase(result.OBJECT_FIELD_NAME);
            if ((returnFields == null) || (Array.isArray(returnFields) && returnFields.length > 0 && returnFields == fieldName)) {
              record[fieldName] = _mapColumns(result.TYPE, result.FIELD_VALUE);
            }
          }
        }
        fieldValueRecords.push(record);
      }
      return fieldValueRecords;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },

  async getUndeletedValues(tenantId, moduleId, returnFields, rowId) {
    try {
      let condition = '';
      if (rowId) {
        condition = `AND  CAST(A.ID AS varchar(5000)) = '${rowId}'`;
      }
      const sqlQuery = `
			SELECT 
      CAST(A.ID AS varchar(5000)) AS "ID",
				B.ID AS FIELD_ID,
				B.FIELD,
				B.TYPE,
				C.FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID 
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID =  A.ID  AND C.FIELD_ID = B.ID
      WHERE A.MODULE_ID = $1 ${condition}
      AND (A.IS_DELETED != true OR A.IS_DELETED IS NULL)
			ORDER BY B.ORDER_SEQ ASC;`;
      const results = await db.submit(sqlQuery, [moduleId]);
      let fieldValueRecords = [];
      let rowIds = [];
      for (const result of results) {
        rowIds.push(result.ID);
      }
      let uniqueRowIds = [...new Set(rowIds)];
      for (const rowId of uniqueRowIds) {
        let record = {};
        for (const result of results) {
          if (result.ID === rowId) {
            let fieldName = result.FIELD; //camelCase(result.OBJECT_FIELD_NAME);
            if ((returnFields == null) || (Array.isArray(returnFields) && returnFields.length > 0 && returnFields == fieldName)) {
              record[fieldName] = _mapColumns(result.TYPE, result.FIELD_VALUE);
            }
          }
        }
        fieldValueRecords.push(record);
      }
      return fieldValueRecords;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },

  async getValuesActive(tenantId, moduleId, returnFields) {
    try {
      const sqlQuery = `
			SELECT 
        CAST(A.ID AS varchar(5000)) AS "ID",
				B.ID AS FIELD_ID,
				B.FIELD,
				B.TYPE,
        CASE B.FIELD 
        		WHEN 'IS_DELETED' THEN CAST(A.IS_DELETED AS VARCHAR(5000))
        		WHEN 'MODIFIED_DATE' THEN A.MODIFIED_DATE
        		WHEN 'MODIFIED_BY' THEN A.MODIFIED_BY
        		WHEN 'CREATED_DATE' THEN A.CREATED_DATE
        		WHEN 'CREATED_BY' THEN A.CREATED_BY
        		WHEN 'VERSION' THEN A.VERSION
        		ELSE C.FIELD_VALUE
        END AS FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1
			AND A.ID IN
			(
				SELECT tblA.ID 
				FROM
				(
						SELECT A.ID,
                 B.MODULE_ID,
                 A.IS_DELETED
						FROM MODULE_DATA_ROWS A 
						LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
			      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
            WHERE A.MODULE_ID = $1
            AND A.IS_DELETED != true OR A.IS_DELETED IS NULL
				)tblA 
				LEFT OUTER JOIN METADATA_FIELD E ON E.MODULE_ID = tblA.MODULE_ID
        LEFT OUTER JOIN MODULE_DATA_FIELDS F ON F.ROW_ID = tblA.ID AND F.FIELD_ID = E.ID
				--WHERE E.FIELD = 'IS_DELETED' AND TO_VARCHAR(F.FIELD_VALUE) = 'false'
      )
			ORDER BY B.ORDER_SEQ ASC;`;
      const results = await db.submit(sqlQuery, [moduleId]);
      let fieldValueRecords = [];
      let rowIds = [];
      for (const result of results) {
        rowIds.push(result.ID);
      }
      let uniqueRowIds = [...new Set(rowIds)];
      for (const rowId of uniqueRowIds) {
        let record = {};
        for (const result of results) {
          if (result.ID === rowId) {
            let fieldName = result.FIELD; //camelCase(result.OBJECT_FIELD_NAME);
            if ((returnFields == null) || (Array.isArray(returnFields) && returnFields.length > 0 && returnFields == fieldName)) {
              record[fieldName] = _mapColumns(result.TYPE, result.FIELD_VALUE);
            }
          }
        }
        fieldValueRecords.push(record);
      }
      return fieldValueRecords;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },

  async getValues(tenantId, moduleId, returnFields, rowId) {
    try {
      let condition = '';
      if (rowId) {
        condition = `AND CAST(A.ID AS varchar(5000)) = '${rowId}' `;
      }
      const sqlQuery = `
			SELECT 
      CAST(A.ID AS varchar(5000)) AS "ID",
				B.ID AS FIELD_ID,
				B.FIELD,
        B.TYPE,
				CASE B.FIELD 
        		WHEN 'IS_DELETED' THEN CAST(A.IS_DELETED AS VARCHAR(5000))
        		WHEN 'MODIFIED_DATE' THEN A.MODIFIED_DATE
        		WHEN 'MODIFIED_BY' THEN A.MODIFIED_BY
        		WHEN 'CREATED_DATE' THEN A.CREATED_DATE
        		WHEN 'CREATED_BY' THEN A.CREATED_BY
        		WHEN 'VERSION' THEN A.VERSION
        		ELSE C.FIELD_VALUE
        END AS FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID =  A.ID  AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1 ${condition}
			ORDER BY B.ORDER_SEQ ASC;`;
      const results = await db.submit(sqlQuery, [moduleId]);
      let fieldValueRecords = [];
      let rowIds = [];
      for (const result of results) {
        rowIds.push(result.ID);
      }
      let uniqueRowIds = [...new Set(rowIds)];
      for (const rowId of uniqueRowIds) {
        let record = {};
        for (const result of results) {
          if (result.ID === rowId) {
            let fieldName = result.FIELD; //camelCase(result.OBJECT_FIELD_NAME);
            if ((returnFields == null) || (Array.isArray(returnFields) && returnFields.length > 0 && returnFields == fieldName)) {
              record[fieldName] = _mapColumns(result.TYPE, result.FIELD_VALUE);
            }
          }
        }
        fieldValueRecords.push(record);
      }
      return fieldValueRecords;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },

  async getValuesByMasterId(tenantId, moduleId, masterField, masterId, returnFields) {
    try {
      const sqlQuery = `
			SELECT 
      CAST(A.ID AS varchar(5000)) AS "ID",
        B.ID AS FIELD_ID,
        B.FIELD,
        B.TYPE,
        C.FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1
			AND A.ID IN
			(
				SELECT tblA.ID 
				FROM
				(
						SELECT A.ID,
							   B.MODULE_ID
						FROM MODULE_DATA_ROWS A 
						LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID AND A.IS_DELETED != true OR A.IS_DELETED IS NULL
			      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
						WHERE A.MODULE_ID = $1
						AND B.FIELD = $3 AND TO_VARCHAR(C.FIELD_VALUE) = $2
				)tblA 
				LEFT OUTER JOIN METADATA_FIELD E ON E.MODULE_ID = tblA.MODULE_ID
				LEFT OUTER JOIN MODULE_DATA_FIELDS F ON F.ROW_ID = tblA.ID AND F.FIELD_ID = E.ID
				--WHERE E.OBJECT_FIELD_NAME = 'SYNCOPERATION' AND TO_VARCHAR(F.FIELD_VALUE) != 'D'
			)
			ORDER BY B.ORDER_SEQ ASC`;
      const results = await db.submit(sqlQuery, [moduleId, masterId, masterField]);
      if (results.length > 0) {
        let fieldValueRecords = [];
        let rowIds = [];
        for (const result of results) {
          rowIds.push(result.ID);
        }
        let uniqueRowIds = [...new Set(rowIds)];
        for (const rowId of uniqueRowIds) {
          let record = {};
          for (const result of results) {
            if (result.ID === rowId) {
              let fieldName = result.FIELD; //camelCase(result.OBJECT_FIELD_NAME);
              if ((returnFields == null) || (Array.isArray(returnFields) && returnFields.length > 0 && returnFields == fieldName)) {
                record[fieldName] = _mapColumns(result.TYPE, result.FIELD_VALUE);
              }
            }
          }
          fieldValueRecords.push(record);
        }
        return fieldValueRecords;
      } else
        return;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },

  async getIsDeletedRow(tenantId, moduleId, rowId) {
    try {
      const sqlQuery = `
      SELECT CAST(IS_DELETED AS BOOLEAN) AS "IS_DELETED"
      FROM MODULE_DATA_ROWS 
      WHERE MODULE_ID = $1 
      AND ID = $2;`;
      const results = await db.submit(sqlQuery, [moduleId, rowId]);
      if (results.length > 0) {
        return results[0].IS_DELETED;
      }
      return true;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields row id ${util.inspect(err)}`);
      throw err;
    }
  },

  async getValuesByPK(tenantId, moduleId, returnFields, pkValue) {
    try {
      const rowId = await this.getRowId(tenantId, moduleId, pkValue);
      if (rowId) {
        const results = await this.getValues(tenantId, moduleId, returnFields, rowId);
        const isDeleted = await this.getIsDeletedRow(tenantId, moduleId, rowId);
        if (results.length > 0) {
          if (pkValue == rowId && isDeleted) {
            return;
          }
          results[0].IS_DELETED = isDeleted;
          return results[0];
        }
      }
      return;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields value by PK ${util.inspect(err)}`);
      throw err;
    }
  },
  async getIdValues(Id) {
    try {
      let bytes;
      let IdValues;

      if (Id == null) {
        return Id;
      }
      else {
        if (Id.includes(':')) {
          bytes = await getBytesFromPrettyStringId(Id);
          IdValues = await getRawStringFromBytesId(bytes);
        } else {
          bytes = await getBytesFromRawStringId(Id);
          IdValues = await getPrettyStringFromBytesId(bytes);
        }
        return IdValues.toUpperCase();
      }
    } catch (err) {
      debug(`Error occured when convert pretty string record ${util.inspect(err)}`);
      throw err;
    }
  },

  async validateRecordUniquebyCodeActive(tenantId, moduleId, distId, fieldName, fieldValue) {
    try {
      let condition = '';
      if (distId) {
        condition = `AND B.FIELD = 'DIST_ID' AND TO_VARCHAR(C.FIELD_VALUE) = $2`;
      }

      const sqlQuery = `
			SELECT 
        A.ID,
        B.ID AS FIELD_ID,
        B.FIELD,
        B.TYPE,
        C.FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1
			AND A.ID IN
			(
					SELECT A.ID
					FROM MODULE_DATA_ROWS A 
					LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
		      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
					WHERE A.MODULE_ID = $1
					AND A.IS_DELETED = false
					${condition}
			)
			AND B.FIELD = $3 AND TO_VARCHAR(C.FIELD_VALUE) = $4;`;
      const results = await db.submit(sqlQuery, [moduleId, await metadata.getIdValues(distId), fieldName, fieldValue]);
      if (results.length > 0) {
        return results.length;
      }
      return;
    } catch (err) {
      debug(`Error occured when validating record unique fields row id ${util.inspect(err)}`);
      throw err;
    }
  },

  async validateRecordUniqueWithThreeCodesActive(tenantId, moduleId, distId, fieldName1, fieldValue1, fieldName2, fieldValue2, fieldName3, fieldValue3) {
    try {
      let condition = '';
      if (fieldName2) {
        condition = `AND UCASE(B.FIELD) = UCASE($5) AND UCASE(TO_VARCHAR(C.FIELD_VALUE)) = UCASE($6) `;
      }
      if (fieldName3) {
        condition = `AND UCASE(B.FIELD) = UCASE($7) AND UCASE(TO_VARCHAR(C.FIELD_VALUE)) = UCASE($8) `;
      }
      if (distId) {
        condition = `AND B.FIELD = 'DIST_ID' AND TO_VARCHAR(C.FIELD_VALUE) = $2 `;
      }

      const sqlQuery = `
			SELECT 
        A.ID,
        B.ID AS FIELD_ID,
        B.FIELD,
        B.TYPE,
        C.FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1
			AND A.ID IN
			(
					SELECT A.ID
					FROM MODULE_DATA_ROWS A 
					LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
		      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
          WHERE A.MODULE_ID = $1
          AND A.IS_DELETED = false
					${condition}
			)
			AND B.FIELD = $3 AND UCASE(TO_VARCHAR(C.FIELD_VALUE)) = UCASE($4);`;
      const results = await db.submit(sqlQuery, [moduleId, distId, fieldName1, fieldValue1, fieldName2, fieldValue2, fieldName3, fieldValue3]);
      if (results.length > 0) {
        return results.length;
      }
      return;
    } catch (err) {
      debug(`Error occured when validating record unique fields row id ${util.inspect(err)}`);
      throw err;
    }
  },

  async validateUniqueRecord(moduleName, fieldName, fieldValue, includeDeleted) {
    try {
      let sqlQuery = `
      SELECT TO_VARCHAR(A.ID) AS "ID"
      FROM MODULE_DATA_ROWS A
      INNER JOIN MODULE_DATA_FIELDS B ON A.ID = B.ROW_ID
        AND TO_VARCHAR(B.FIELD_VALUE) = $3
      INNER JOIN METADATA_MODULE C ON A.MODULE_ID = C.ID
        AND C.LOGICAL_ID = $1
      INNER JOIN METADATA_FIELD D ON B.FIELD_ID = D.ID
        AND D.FIELD = $2`;
      sqlQuery += includeDeleted ? ';' : `
      WHERE A.IS_DELETED = false;`;
      const results = await db.submit(sqlQuery, [moduleName, fieldName, fieldValue]);

      if (results.length > 0) {
        return results[0].ID;
      } else {
        return;
      }
    } catch (err) {
      debug(`Error occured when validating record unique fields (exclude self record) ${util.inspect(err)}`);
      throw err;
    }
  },

  async insertFieldValues(tenantId, moduleId, newFields, moduleName) {
    try {
      const idmodule = await getId(moduleName);
      console.log('Module ID:' + idmodule);
      let todayDate = new Date().toISOString();
      let isDeleted = false;
      const client = await db.getClient();
      await db.doInTransaction(async () => {
        //const nextRow = await db.submitTran(`SELECT CAST(MAX(CAST(ID AS INT)) + 1 AS varchar(5000)) AS "ID" FROM MODULE_DATA_ROWS`, [], client);
        //console.log('Next Row: ' + nextRow[0].ID);
        await db.submitTran(`INSERT INTO MODULE_DATA_ROWS(ID, MODULE_ID, IS_DELETED, 
                              MODIFIED_DATE, MODIFIED_BY, CREATED_DATE, CREATED_BY, VERSION) 
                              VALUES($1, $2, $3, $4, $5, $6, $7, $8)`, [idmodule.bytes, moduleId, isDeleted, todayDate, 'user', todayDate, 'user', '1'], client);
        //const results = await db.submitTran(`SELECT CAST(MAX(ID) AS varchar(5000)) AS "ID" FROM MODULE_DATA_ROWS`, [], client);
        if (idmodule.prettyStr.length > 0) {
          //const rowId = idmodule.bytes; //nextRow[0].ID;				
          const pkFieldName = await this.getPK(moduleId);
          const id = uuidv4();
          newFields[pkFieldName] = id;
          let fieldNames = Object.keys(newFields);
          for (let i = 0; i < fieldNames.length; i++) {
            let fieldName = fieldNames[i];
            let fieldValue = `${newFields[fieldName]}`;

            let sqlQuery = `
							INSERT INTO MODULE_DATA_FIELDS(FIELD_ID, ROW_ID, FIELD_VALUE)
							SELECT ID, $2, $4 
							FROM METADATA_FIELD 
							WHERE MODULE_ID = $1 AND FIELD = $3`;
            await db.submitTran(sqlQuery, [moduleId, idmodule.rawStr, fieldName, fieldValue], client);
          }
        }
      }, client);
    } catch (err) {
      debug(`Error occured when inserting metadata field values ${util.inspect(err)}`);
      throw err;
    }
  },

  async updateFieldValues(tenantId, moduleId, pkValue, updatedFields) {
    try {
      const rowId = await this.getRowId(tenantId, moduleId, pkValue);

      if (rowId) {
        const client = await db.getClient();
        await db.doInTransaction(async () => {
          let fieldNames = Object.keys(updatedFields);
          for (let i = 0; i < fieldNames.length; i++) {
            let fieldName = fieldNames[i];
            let fieldValue = `${updatedFields[fieldName]}`;
            let sqlQuery = `
              UPDATE A 
                SET A.FIELD_VALUE = $5
              FROM MODULE_DATA_FIELDS A
              INNER JOIN MODULE_DATA_ROWS B ON B.ID = A.ROW_ID AND B.MODULE_ID = $2 --AND B.TENANT_ID = $1
              INNER JOIN METADATA_FIELD C ON C.MODULE_ID = B.MODULE_ID AND C.ID = A.FIELD_ID AND C.FIELD = $4
              WHERE A.ROW_ID = $3`;
            await db.submitTran(sqlQuery, [tenantId, moduleId, rowId, fieldName, fieldValue], client);
            /*
            sqlQuery = `
                INSERT INTO MODULE_DATA_FIELDS(FIELD_ID, ROW_ID, FIELD_VALUE)
                SELECT A.ID, $2, $4 
                FROM METADATA_FIELD A
                LEFT OUTER JOIN MODULE_DATA_FIELDS B ON B.FIELD_ID = A.FIELD_ID
                WHERE A.MODULE_ID = $1 AND A.FIELD = $3 AND B.FIELD_ID IS NULL`;
            await db.submit(sqlQuery, [moduleId, rowId, fieldName, fieldValue]);
            */
          }
        }, client);
      }

    } catch (err) {
      debug(`Error occured when updating metadata field values ${util.inspect(err)}`);
      throw err;
    }
  },

  async updateOptionValuesforRelatedFieldbyDistId(tenantId, moduleId, codeField, descField, moduleIdUpdate, fieldUpdate, distId) {
    try {
      const sqlQuery = `select A.ID ROW_ID, 
                               A.MODULE_ID, 
                               B.ID FIELD_ID_CD, 
                               C.ID FIELD_ID_DESC , 
                               D.FIELD_VALUE CODE, 
                               E.FIELD_VALUE DESC
			FROM MODULE_DATA_ROWS A 
			JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID AND B.FIELD= $2
			LEFT OUTER JOIN METADATA_FIELD C ON C.MODULE_ID = A.MODULE_ID AND C.FIELD= $3
			LEFT OUTER JOIN MODULE_DATA_FIELDS D ON D.ROW_ID =  A.ID  AND D.FIELD_ID = B.ID
			LEFT OUTER JOIN MODULE_DATA_FIELDS E ON E.ROW_ID =  A.ID  AND E.FIELD_ID = C.ID
			JOIN METADATA_FIELD F ON F.MODULE_ID = A.MODULE_ID AND F.FIELD= 'DIST_ID' 
			LEFT OUTER JOIN MODULE_DATA_FIELDS G ON G.ROW_ID =  A.ID  AND G.FIELD_ID = F.ID 
			WHERE A.MODULE_ID = $1  AND A.IS_DELETED = false AND TO_CHAR(G.FIELD_VALUE) = $4 ;`;
      const results = await db.submit(sqlQuery, [moduleId, codeField, descField, await metadata.getIdValues(distId)]);
      let option_val = '{';
      var i = 0;
      for (const result of results) {
        option_val = option_val + '"' + result.CODE + '" : "' + result.CODE + ' - ' + result.DESC + '"';
        i++;
        if (i < results.length) {
          option_val += ',';
        }
      }
      option_val += '}';

      const client = await db.getClient();
      await db.doInTransaction(async () => {
        let sqlQueryUpdate = `UPDATE METADATA_FIELD SET OPTION_VALUES  = $1
                                  WHERE MODULE_ID = $2 AND FIELD = $3;`;
        await db.submitTran(sqlQueryUpdate, [option_val, moduleIdUpdate, fieldUpdate], client);
      }, client);
    } catch (err) {
      debug(`Error occured when updating custom field values ${util.inspect(err)}`);
      throw err;
    }
  },

  async updateOptionValuesforRelatedField(tenantId, moduleId, codeField, descField, moduleIdUpdate, fieldUpdate) {
    try {
      const sqlQuery = `select A.ID ROW_ID, 
                               A.MODULE_ID, 
                               B.ID FIELD_ID_CD, 
                               C.ID FIELD_ID_DESC , 
                               D.FIELD_VALUE CODE, 
                               E.FIELD_VALUE DESC
			FROM MODULE_DATA_ROWS A 
			JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID AND B.FIELD= $2
			LEFT OUTER JOIN METADATA_FIELD C ON C.MODULE_ID = A.MODULE_ID AND C.FIELD= $3
			LEFT OUTER JOIN MODULE_DATA_FIELDS D ON D.ROW_ID =  A.ID  AND D.FIELD_ID = B.ID
			LEFT OUTER JOIN MODULE_DATA_FIELDS E ON E.ROW_ID =  A.ID  AND E.FIELD_ID = C.ID
			WHERE A.MODULE_ID = $1  AND A.IS_DELETED = false ;`;
      const results = await db.submit(sqlQuery, [moduleId, codeField, descField]);
      let option_val = '{';
      var i = 0;
      for (const result of results) {
        option_val = option_val + '"' + result.CODE + '" : "' + result.CODE + ' - ' + result.DESC + '"';
        i++;
        if (i < results.length) {
          option_val += ',';
        }
      }
      option_val += '}';

      const client = await db.getClient();
      await db.doInTransaction(async () => {
        let sqlQueryUpdate = `UPDATE METADATA_FIELD SET OPTION_VALUES  = $1
                                  WHERE MODULE_ID = $2 AND FIELD = $3;`;
        await db.submitTran(sqlQueryUpdate, [option_val, moduleIdUpdate, fieldUpdate], client);
      }, client);
    } catch (err) {
      debug(`Error occured when updating custom field values ${util.inspect(err)}`);
      throw err;
    }
  },

  async deleteFieldValues(tenantId, moduleId, pkValue) {
    let modified_date = new Date().toISOString();
    try {
      const rowId = await this.getRowId(tenantId, moduleId, pkValue);

      if (rowId) {
        const client = await db.getClient();
        await db.doInTransaction(async () => {
          let sqlQuery = `
              UPDATE MODULE_DATA_ROWS
              SET IS_DELETED = true, MODIFIED_DATE = $2
              WHERE ID = $1`;
          await db.submitTran(sqlQuery, [rowId, modified_date], client);
          /*
          sqlQuery = `
              DELETE FROM CORE_OBJECT_DATA 
              WHERE OBJECT_ROW_ID = $1`;
          await db.submitTran(sqlQuery, [rowId], client);
          */
        }, client);
      }

    } catch (err) {
      debug(`Error occured when deleting metadata field values ${util.inspect(err)}`);
      throw err;
    }
  },

  async validateFieldDataType(moduleId, NewRecords) {
    const sqlQuery = `SELECT 
                      ID,
                      FIELD,
                      TYPE,
                      VALIDATION
                      FROM METADATA_FIELD 
                      WHERE MODULE_ID = $1
                      ORDER BY ORDER_SEQ ASC`;
    const results = await db.submit(sqlQuery, [moduleId]);
    console.log('Start Validate Data Type');
    try {
      if (results.length > 0) {
        let rowIds = [];
        let fieldRecord = Object.keys(NewRecords);

        for (const result of results) {
          for (let j = 0; j < fieldRecord.length; j++) {
            let fieldName = fieldRecord[j];
            //console.log('Fields Loop - ' + j + ' ' + fieldName);
            if (result.FIELD === fieldName) {
              let isValidDate = Date.parse(NewRecords[fieldName]);
              switch (result.TYPE) {
                case 'number':
                  if (isNaN(NewRecords[fieldName])) {
                    rowIds.push(fieldName);
                    //console.log('Validation Error for Field Name: ' + fieldName + ' values= ' + NewRecords[fieldName]);
                  }
                  break;
                case 'boolean':
                  if (NewRecords[fieldName] != true && NewRecords[fieldName] != false) {
                    rowIds.push(fieldName);
                  }
                  break;
                case 'date':
                  if (isNaN(isValidDate)) {
                    rowIds.push(fieldName);
                  }
                  break;
              }
              fieldRecord.splice(j, 1);
            }
          }
        }
        return rowIds;
      } else
        return;
    } catch (err) {
      debug(`Error occured when validating field data type ${util.inspect(err)}`);
      throw err;
    }
  },

  async validateRecordUniquebyCode(tenantId, moduleId, fieldName, fieldValue) {
    try {

      const sqlQuery = `
			SELECT 
        A.ID,
        B.ID AS FIELD_ID,
        B.FIELD,
        B.TYPE,
        C.FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1
			AND A.ID IN
			(
					SELECT A.ID
					FROM MODULE_DATA_ROWS A 
					LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
		      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
					WHERE A.MODULE_ID = $1
			)
			AND B.FIELD = $2 AND TO_VARCHAR(C.FIELD_VALUE) = $3;`;
      const results = await db.submit(sqlQuery, [moduleId, fieldName, fieldValue]);
      if (results.length > 0) {
        return results.length;
      }
      return 0;
    } catch (err) {
      debug(`Error occured when validating record unique fields row id ${util.inspect(err)}`);
      throw err;
    }
  },

  async validateActiveRecordUniqueby2Factors(tenantId, moduleId, fieldName0, fieldValue0, fieldName1, fieldValue1) {
    try {

      const sqlQuery = `
      SELECT A.ID
			FROM MODULE_DATA_ROWS A 
			INNER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
            INNER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1
			AND A.IS_DELETED=false
			AND ((B.FIELD = $2 AND TO_VARCHAR(C.FIELD_VALUE) = $3)
			OR (B.FIELD = $4 AND TO_VARCHAR(C.FIELD_VALUE) = $5))
			GROUP BY A.ID HAVING COUNT(DISTINCT C.FIELD_ID)=2;`;
      const results = await db.submit(sqlQuery, [moduleId, fieldName0, fieldValue0, fieldName1, fieldValue1]);
      if (results.length > 0) {
        return results.length;
      }
      return 0;
    } catch (err) {
      debug(`Error occured when validating record unique fields row id ${util.inspect(err)}`);
      throw err;
    }
  },

  async updateFieldValuesWithoutCode(tenantId, moduleId, pkValue, updatedFields, codeFieldName) {
    try {
      const rowId = await this.getRowId(tenantId, moduleId, pkValue);
      //const client = await db.getClient();
      //await db.doInTransaction(async () => {
      if (rowId) {
        let fieldNames = Object.keys(updatedFields);
        for (let i = 0; i < fieldNames.length; i++) {
          if (fieldNames[i] != codeFieldName) {
            let fieldName = fieldNames[i];
            let fieldValue = `${updatedFields[fieldName]}`;
            if (fieldValue == 'null') {
              fieldValue = '';
            }
            let sqlQuery = `
              UPDATE A 
                SET A.FIELD_VALUE = $5
              FROM MODULE_DATA_FIELDS A
              INNER JOIN MODULE_DATA_ROWS B ON B.ID = A.ROW_ID AND B.MODULE_ID = $2
              INNER JOIN METADATA_FIELD C ON C.MODULE_ID = B.MODULE_ID AND C.ID = A.FIELD_ID AND C.FIELD = $4
              WHERE A.ROW_ID = $3`;
            await db.submit(sqlQuery, [tenantId, moduleId, rowId, fieldName, fieldValue]);
            sqlQuery = `
            INSERT INTO MODULE_DATA_FIELDS(FIELD_ID, ROW_ID, FIELD_VALUE)
            SELECT A.ID, $2, $4 
            FROM METADATA_FIELD A
            LEFT JOIN MODULE_DATA_FIELDS B ON A.ID = B.FIELD_ID AND B.ROW_ID = $2
            WHERE A.MODULE_ID =$1 AND A.FIELD = $3 AND B.FIELD_ID IS NULL`;
            await db.submit(sqlQuery, [moduleId, rowId, fieldName, fieldValue]);
          }
        }
        return updatedFields;
      }
      //}, client);
    } catch (err) {
      debug(`Error occured when updating metadata field values ${util.inspect(err)}`);
      throw err;
    }
  },

  async getActiveRecordRowId(logicalId, fieldName, like_fieldValue) {
    try {
      const sqlQuery = `
      SELECT CAST(ID AS varchar(5000)) AS "ROW_ID"
      FROM MODULE_DATA_ROWS WHERE ID IN (
        SELECT ROW_ID FROM MODULE_DATA_FIELDS WHERE FIELD_ID IN (
          SELECT ID FROM METADATA_FIELD WHERE MODULE_ID IN (
            SELECT ID FROM METADATA_MODULE WHERE LOGICAL_ID = $1
          ) 
          AND FIELD = $2
        )
        AND FIELD_VALUE LIKE $3
      )
      AND IS_DELETED != true`;

      const results = await db.submit(sqlQuery, [logicalId, fieldName, like_fieldValue]);
      if (results.length > 0) {
        return results[0].ROW_ID;
      }
      return;

    } catch (err) {
      debug(`Error occured when retrieving metadata fields row id ${util.inspect(err)}`);
      throw err;
    }
  },
  async getValuesByPrinciplaId(tenantId, moduleId, principalId, returnFields) {
    try {
      const sqlQuery = `
			SELECT 
      CAST(A.ID AS varchar(5000)) AS "ID",
        B.ID AS FIELD_ID,
        B.FIELD,
        B.TYPE,
        C.FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1
			AND A.ID IN
			(
				SELECT tblA.ID 
				FROM
				(
						SELECT A.ID,
							   B.MODULE_ID
						FROM MODULE_DATA_ROWS A 
						LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID AND A.IS_DELETED != true OR A.IS_DELETED IS NULL
			      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
						WHERE A.MODULE_ID = $1
						AND B.FIELD = 'PRINCIPAL_ID' AND TO_VARCHAR(C.FIELD_VALUE) = $2
				)tblA 
				INNER JOIN METADATA_FIELD E ON E.MODULE_ID = tblA.MODULE_ID
				INNER JOIN MODULE_DATA_FIELDS F ON F.ROW_ID = tblA.ID AND F.FIELD_ID = E.ID
				--WHERE E.OBJECT_FIELD_NAME = 'SYNCOPERATION' AND TO_VARCHAR(F.FIELD_VALUE) != 'D'
			)
			ORDER BY B.ORDER_SEQ ASC`;
      const results = await db.submit(sqlQuery, [moduleId, principalId]);
      if (results.length > 0) {
        let fieldValueRecords = [];
        let rowIds = [];
        for (const result of results) {
          rowIds.push(result.ID);
        }
        let uniqueRowIds = [...new Set(rowIds)];
        for (const rowId of uniqueRowIds) {
          let record = {};
          for (const result of results) {
            if (result.ID === rowId) {
              let fieldName = result.FIELD; //camelCase(result.OBJECT_FIELD_NAME);
              if ((returnFields == null) || (Array.isArray(returnFields) && returnFields.length > 0 && returnFields.find(a => a === fieldName))) {
                record[fieldName] = _mapColumns(result.TYPE, result.FIELD_VALUE);
              }
            }
          }
          fieldValueRecords.push(record);
        }
        return fieldValueRecords;
      } else
        return;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },
  async getValuesByFieldName(tenantId, moduleId, fieldName, fieldValue, returnFields) {
    try {
      const sqlQuery = `
			SELECT 
      CAST(A.ID AS varchar(5000)) AS "ID",
        B.ID AS FIELD_ID,
        B.FIELD,
        B.TYPE,
        C.FIELD_VALUE
			FROM MODULE_DATA_ROWS A 
			LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID
      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
			WHERE A.MODULE_ID = $1
			AND A.ID IN
			(
				SELECT tblA.ID 
				FROM
				(
						SELECT A.ID,
							   B.MODULE_ID
						FROM MODULE_DATA_ROWS A 
						LEFT OUTER JOIN METADATA_FIELD B ON B.MODULE_ID = A.MODULE_ID AND A.IS_DELETED != true OR A.IS_DELETED IS NULL
			      LEFT OUTER JOIN MODULE_DATA_FIELDS C ON C.ROW_ID = A.ID AND C.FIELD_ID = B.ID
						WHERE A.MODULE_ID = $1
						AND B.FIELD = $2 AND TO_VARCHAR(C.FIELD_VALUE) = $3
				)tblA 
				LEFT OUTER JOIN METADATA_FIELD E ON E.MODULE_ID = tblA.MODULE_ID
				LEFT OUTER JOIN MODULE_DATA_FIELDS F ON F.ROW_ID = tblA.ID AND F.FIELD_ID = E.ID
				--WHERE E.OBJECT_FIELD_NAME = 'SYNCOPERATION' AND TO_VARCHAR(F.FIELD_VALUE) != 'D'
			)
			ORDER BY B.ORDER_SEQ ASC`;
      const results = await db.submit(sqlQuery, [moduleId, fieldName, fieldValue]);
      if (results.length > 0) {
        let fieldValueRecords = [];
        let rowIds = [];
        for (const result of results) {
          rowIds.push(result.ID);
        }
        let uniqueRowIds = [...new Set(rowIds)];
        for (const rowId of uniqueRowIds) {
          let record = {};
          for (const result of results) {
            if (result.ID === rowId) {
              let fieldName = result.FIELD; //camelCase(result.OBJECT_FIELD_NAME);
              if ((returnFields == null) || (Array.isArray(returnFields) && returnFields.length > 0 && returnFields == fieldName)) {
                record[fieldName] = _mapColumns(result.TYPE, result.FIELD_VALUE);
              }
            }
          }
          fieldValueRecords.push(record);
        }
        return fieldValueRecords;
      } else
        return;
    } catch (err) {
      debug(`Error occured when retrieving metadata fields ${util.inspect(err)}`);
      throw err;
    }
  },
  async checkIdExistancy(logicalId, objectId, errorMessage) {
    logger.debug(`Checking the existancy of ${objectId} in ${logicalId} module`);

    try {
      await metaModule.get(logicalId, objectId);
    } catch (error) {
      throw new NotFoundError(errorMessage);
    }
  }
  ,
  async fielterResults(results, returnFields) {
    if (results.length > 0) {
      let fieldValueRecords = [];
      let record = {};
      for (const result of results) {
        let fieldName = result; 
        let fieldValue = results[result];
        if ((returnFields == null) || (Array.isArray(returnFields) && returnFields.length > 0 && returnFields == fieldName)) {
          record[fieldName] = fieldValue;
        }
        fieldValueRecords.push(record);
      }
      return fieldValueRecords;
    } else
      return;
  }
};




function _mapColumns(colType, colValue) {
  if (colType == 'boolean') {
    return (colValue == '1' || colValue == 'true') ? true : false;
  }
  if (colValue) {
    if (colType == 'decimal') {
      return Number(colValue);
    } else if (colType == 'timestamp') {
      return moment(colValue).format('YYYY-MM-DDTHH:mm:ssZ');
    }
  }
  return colValue;
}


module.exports = metadata;
