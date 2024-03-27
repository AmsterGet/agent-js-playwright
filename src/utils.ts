/*
 *  Copyright 2022 EPAM Systems
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

import { TestCase, TestStatus, TestResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { name as pjsonName, version as pjsonVersion } from '../package.json';
import { Attribute, Attachment, AttachmentsConfig } from './models';
import {
  STATUSES,
  TestAnnotation,
  TestOutcome,
  BASIC_ATTACHMENT_NAMES,
  BASIC_ATTACHMENT_CONTENT_TYPES,
  TEST_ANNOTATION_TYPES,
  TEST_OUTCOME_TYPES,
} from './constants';

const fsPromises = fs.promises;

export const isFalse = (value: string | boolean | undefined): boolean =>
  [false, 'false'].includes(value);

export const promiseErrorHandler = (promise: Promise<void>, message = ''): Promise<void> =>
  promise.catch((err) => {
    console.error(message, err);
  });

export const getAgentInfo = (): { version: string; name: string } => ({
  version: pjsonVersion,
  name: pjsonName,
});

export const getSystemAttributes = (skippedIssue = true): Array<Attribute> => {
  const systemAttributes = [
    {
      key: 'agent',
      value: `${pjsonName}|${pjsonVersion}`,
      system: true,
    },
  ];

  if (isFalse(skippedIssue)) {
    const skippedIssueAttribute = {
      key: 'skippedIssue',
      value: 'false',
      system: true,
    };
    systemAttributes.push(skippedIssueAttribute);
  }

  return systemAttributes;
};

type testItemPick = Pick<TestCase, 'titlePath'>;

export const getCodeRef = (
  testItem: testItemPick,
  itemTitle: string,
  pathToExclude?: string,
): string => {
  if (!itemTitle) {
    return '';
  }
  const filteredTitlesPath = testItem
    .titlePath()
    .filter((itemPath) => itemPath !== '' && itemPath !== pathToExclude);
  const itemIndex = filteredTitlesPath.indexOf(itemTitle);

  return filteredTitlesPath
    .slice(0, itemIndex + 1)
    .join('/')
    .replace(new RegExp('\\'.concat(path.sep), 'g'), '/');
};

export const sendEventToReporter = (type: string, data: any, suite?: string): void => {
  process.stdout.write(JSON.stringify({ type, data, suite }));
};

export const getAttachments = async (
  attachments: TestResult['attachments'],
  { uploadTrace, uploadVideo }: AttachmentsConfig = { uploadTrace: true, uploadVideo: true },
): Promise<Attachment[]> => {
  const isTraceNotAllowed = isFalse(uploadTrace);
  const isVideoNotAllowed = isFalse(uploadVideo);

  const readFilePromises = attachments
    .filter(({ name, path: attachmentPath, contentType, body }) => {
      const isValidAttachment = body || attachmentPath;

      const ignoreAsTrace =
        isTraceNotAllowed &&
        name === BASIC_ATTACHMENT_NAMES.TRACE &&
        contentType === BASIC_ATTACHMENT_CONTENT_TYPES.TRACE;

      const ignoreAsVideo =
        isVideoNotAllowed &&
        name === BASIC_ATTACHMENT_NAMES.VIDEO &&
        contentType === BASIC_ATTACHMENT_CONTENT_TYPES.VIDEO;

      return isValidAttachment && !ignoreAsTrace && !ignoreAsVideo;
    })
    .map(async ({ name, path: attachmentPath, contentType, body }) => {
      let fileContent;

      try {
        if (body) {
          fileContent = body;
        } else {
          const isFileExist = await fileExists(attachmentPath);
          if (!isFileExist) {
            return;
          }
          fileContent = await fsPromises.readFile(attachmentPath);
        }
      } catch (e) {
        console.error(e);
        return;
      }

      return {
        name,
        type: contentType,
        content: fileContent,
      };
    });

  return (await Promise.all(readFilePromises)).filter(Boolean);
};

export const fileExists = async (path: string) => {
  try {
    await fsPromises.stat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') { // File does not exist
      return false;
    } else {
      throw error;
    }
  }
}

export const isErrorLog = (message: string): boolean => {
  return message.toLowerCase().includes('error');
};

// https://playwright.dev/docs/api/class-testresult#test-result-status
export const calculateRpStatus = (
  outcome: TestOutcome,
  status: TestStatus,
  annotations: TestAnnotation[],
): STATUSES => {
  let calculatedStatus = STATUSES.FAILED;

  switch (outcome) {
    case TEST_OUTCOME_TYPES.EXPECTED:
      calculatedStatus = STATUSES.PASSED;
      break;
    case TEST_OUTCOME_TYPES.FLAKY:
      calculatedStatus = STATUSES.PASSED;
      break;
    case TEST_OUTCOME_TYPES.UNEXPECTED:
      if (annotations.some((annotation) => annotation.type === TEST_ANNOTATION_TYPES.FAIL)) {
        calculatedStatus = status === STATUSES.PASSED ? STATUSES.FAILED : STATUSES.PASSED;
      }
      break;
    case TEST_OUTCOME_TYPES.SKIPPED:
      calculatedStatus = status === STATUSES.INTERRUPTED ? STATUSES.INTERRUPTED : STATUSES.SKIPPED;
      break;
    default:
      break;
  }

  return calculatedStatus;
};
