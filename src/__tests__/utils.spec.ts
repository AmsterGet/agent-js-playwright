/*
 *  Copyright 2021 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

// @ts-ignore
import { name as pjsonName, version as pjsonVersion } from '../../package.json';
import {
  getAgentInfo,
  getCodeRef,
  getSystemAttributes,
  promiseErrorHandler,
  sendEventToReporter,
  isFalse,
  getAttachments,
} from '../utils';
import fs from 'fs';
import path from 'path';
import { TEST_ITEM_TYPES } from '../constants';

describe('testing utils', () => {
  test('isFalse', () => {
    expect(isFalse(false)).toBe(true);
    expect(isFalse('false')).toBe(true);
    expect(isFalse(undefined)).toBe(false);
    expect(isFalse(null)).toBe(false);
  });

  describe('promiseErrorHandler', () => {
    let spyConsoleError: jest.SpyInstance;
    beforeEach(() => {
      spyConsoleError = jest.spyOn(console, 'error');
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should log error with empty message as it is not provided in case of promise rejected', async () => {
      const promiseWithError = Promise.reject('error message');
      await promiseErrorHandler(promiseWithError);

      expect(spyConsoleError).toBeCalledTimes(1);
      expect(spyConsoleError).toBeCalledWith('', 'error message');
    });

    test('should log error with provided message in case of promise rejected', async () => {
      const promiseWithError = Promise.reject('error message');
      await promiseErrorHandler(promiseWithError, 'Failed to finish suite');

      expect(spyConsoleError).toBeCalledTimes(1);
      expect(spyConsoleError).toBeCalledWith('Failed to finish suite', 'error message');
    });

    test('should not log anything in case of promise resolved', async () => {
      const promise = Promise.resolve();
      await promiseErrorHandler(promise, 'Failed to finish suite');

      expect(spyConsoleError).toBeCalledTimes(0);
    });
  });

  describe('getAgentInfo', () => {
    test('should return the name and version of application from package.json file', () => {
      const agentInfo = getAgentInfo();

      expect(agentInfo.name).toBe(pjsonName);
      expect(agentInfo.version).toBe(pjsonVersion);
    });
  });

  describe('getSystemAttributes', () => {
    const expectedRes = [
      {
        key: 'agent',
        value: `${pjsonName}|${pjsonVersion}`,
        system: true,
      },
    ];
    test('should return the list of system attributes', () => {
      const systemAttributes = getSystemAttributes();

      expect(systemAttributes).toEqual(expectedRes);
    });

    test('should return expected list of system attributes in case skippedIssue=false', () => {
      const systemAttributes = getSystemAttributes(false);
      const skippedIssueAttribute = {
        key: 'skippedIssue',
        value: 'false',
        system: true,
      };

      expect(systemAttributes).toEqual([...expectedRes, skippedIssueAttribute]);
    });
  });

  describe('getCodeRef', () => {
    jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
    const mockedTest = {
      location: {
        file: `C:${path.sep}testProject${path.sep}test${path.sep}example.js`,
        line: 5,
        column: 3,
      },
      titlePath: () => ['example.js', 'rootDescribe', 'parentDescribe', 'testTitle'],
    };

    test('codeRef should be correct for TEST_ITEM_TYPES.SUITE', () => {
      const expectedCodeRef = `test/example.js`;
      const codeRef = getCodeRef(mockedTest, TEST_ITEM_TYPES.SUITE);

      expect(codeRef).toEqual(expectedCodeRef);
    });

    test('codeRef should be correct for TEST_ITEM_TYPES.TEST with offset 1', () => {
      const expectedCodeRef = `test/example.js/rootDescribe`;
      const codeRef = getCodeRef(mockedTest, TEST_ITEM_TYPES.TEST, 1);

      expect(codeRef).toEqual(expectedCodeRef);
    });

    test('codeRef should be correct for TEST_ITEM_TYPES.TEST without offset', () => {
      const expectedCodeRef = `test/example.js/rootDescribe/parentDescribe`;
      const codeRef = getCodeRef(mockedTest, TEST_ITEM_TYPES.TEST);

      expect(codeRef).toEqual(expectedCodeRef);
    });

    test('codeRef should be correct for TEST_ITEM_TYPES.STEP', () => {
      const expectedCodeRef = `test/example.js/rootDescribe/parentDescribe/testTitle`;
      const codeRef = getCodeRef(mockedTest, TEST_ITEM_TYPES.STEP);

      expect(codeRef).toEqual(expectedCodeRef);
    });
  });
  describe('sendEventToReporter', () => {
    test('func must send event to reporter', () => {
      const type = 'ADD_ATTRIBUTES';
      const data = [
        {
          key: 'key',
          value: 'value',
        },
      ];
      const spyProcess = jest.spyOn(process.stdout, 'write');
      sendEventToReporter(type, data);
      expect(spyProcess).toHaveBeenCalledWith(JSON.stringify({ type, data }));
    });
  });

  describe('getAttachments', () => {
    test('should return correct attachment list with presented body', async () => {
      const fileData = Buffer.from([1, 2, 3, 4, 5, 6, 7]);
      const attachments = [
        {
          name: 'filename',
          contentType: 'image/png',
          body: fileData,
        },
      ];

      const expectedAttachments = [
        {
          name: 'filename',
          type: 'image/png',
          content: fileData,
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(attachmentResult).toEqual(expectedAttachments);
    });

    test('should return an empty attachment list in case of no body and no path provided', async () => {
      const attachments = [
        {
          name: 'filename',
          contentType: 'image/png',
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(attachmentResult).toEqual([]);
    });

    test("should return an empty attachment list in case of no body, path provided, but file doesn't exists", async () => {
      jest.spyOn(fs, 'existsSync').mockImplementationOnce((): boolean => false);

      const attachments = [
        {
          name: 'filename',
          contentType: 'image/png',
          path: 'path/to/attachment',
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(attachmentResult).toEqual([]);
    });

    test('should return correct attachment list with presented path and body', async () => {
      const file1Data = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
      const file2Data = Buffer.from([1, 2, 3, 4, 5, 6, 7]);

      jest.spyOn(fs, 'existsSync').mockImplementationOnce((): boolean => true);

      jest.spyOn(fs.promises, 'readFile').mockImplementationOnce(async () => file1Data);

      const attachments = [
        {
          name: 'filename1',
          contentType: 'image/png',
          path: 'path/to/attachment',
        },
        {
          name: 'filename2',
          contentType: 'image/png',
          body: file2Data,
        },
        {
          name: 'filename3',
          contentType: 'image/png',
        },
      ];

      const expectedAttachments = [
        {
          name: 'filename1',
          type: 'image/png',
          content: file1Data,
        },
        {
          name: 'filename2',
          type: 'image/png',
          content: file2Data,
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(attachmentResult).toEqual(expectedAttachments);
    });
  });
});
