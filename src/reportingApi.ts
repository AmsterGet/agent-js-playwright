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

import { EVENTS } from '@reportportal/client-javascript/lib/constants/events';
import { RP_STATUSES } from '@reportportal/client-javascript/lib/constants/statuses';
import { sendEventToReporter } from './utils';
import { Attribute } from './models';

export const ReportingApi = {
  addAttributes: (attrs: Attribute[], suite?: string) =>
    sendEventToReporter(EVENTS.ADD_ATTRIBUTES, attrs, suite),
  setDescription: (description: string, suite?: string) =>
    sendEventToReporter(EVENTS.SET_DESCRIPTION, description, suite),
  setTestCaseId: (testCaseId: string, suite?: string) =>
    sendEventToReporter(EVENTS.SET_TEST_CASE_ID, testCaseId, suite),
  setStatusPassed: (suite?: string) =>
    sendEventToReporter(EVENTS.SET_STATUS, RP_STATUSES.PASSED, suite),
  setStatusFailed: (suite?: string) =>
    sendEventToReporter(EVENTS.SET_STATUS, RP_STATUSES.FAILED, suite),
  setStatusSkipped: (suite?: string) =>
    sendEventToReporter(EVENTS.SET_STATUS, RP_STATUSES.SKIPPED, suite),
  setStatusStopped: (suite?: string) =>
    sendEventToReporter(EVENTS.SET_STATUS, RP_STATUSES.STOPPED, suite),
  setStatusInterrupted: (suite?: string) =>
    sendEventToReporter(EVENTS.SET_STATUS, RP_STATUSES.INTERRUPTED, suite),
  setStatusCancelled: (suite?: string) =>
    sendEventToReporter(EVENTS.SET_STATUS, RP_STATUSES.CANCELLED, suite),
  setStatusInfo: (suite?: string) =>
    sendEventToReporter(EVENTS.SET_STATUS, RP_STATUSES.INFO, suite),
  setStatusWarn: (suite?: string) =>
    sendEventToReporter(EVENTS.SET_STATUS, RP_STATUSES.WARN, suite),
  setLaunchStatusPassed: () => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, RP_STATUSES.PASSED),
  setLaunchStatusFailed: () => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, RP_STATUSES.FAILED),
  setLaunchStatusSkipped: () => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, RP_STATUSES.SKIPPED),
  setLaunchStatusStopped: () => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, RP_STATUSES.STOPPED),
  setLaunchStatusInterrupted: () =>
    sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, RP_STATUSES.INTERRUPTED),
  setLaunchStatusCancelled: () =>
    sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, RP_STATUSES.CANCELLED),
  setLaunchStatusInfo: () => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, RP_STATUSES.INFO),
  setLaunchStatusWarn: () => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, RP_STATUSES.WARN),
};
