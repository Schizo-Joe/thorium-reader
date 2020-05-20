// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    takeSpawnEvery, takeSpawnEveryChannel,
} from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { all, call, put } from "redux-saga/effects";

import { readerLocalActionHighlights, readerLocalActionLocatorHrefChanged } from "../../actions";
import {
    getHightlightClickChannel, mountHighlight, THighlightClick, unmountHightlight,
} from "./mounter";

function* push(action: readerLocalActionHighlights.handler.push.TAction) {
    if (action.payload) {

        const href = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.locator?.href);
        yield call(mountHighlight, href, action.payload);
    }
}

function* pop(action: readerLocalActionHighlights.handler.pop.TAction) {
    if (action.payload) {

        const href = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.locator?.href);
        yield call(unmountHightlight, href, action.payload);
    }
}

function* hrefChanged(action: readerLocalActionLocatorHrefChanged.TAction) {

    const { payload: { href } } = action;

    const mounterState = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    const mounterUuid = mounterState.map(([uuid]) => ({ uuid }));
    yield call(unmountHightlight, href, mounterUuid);

    const handlerState = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.handler);
    const handler = handlerState.map(([, state]) => state);
    yield call(mountHighlight, href, handler);
}

function* dispatchClick(data: THighlightClick) {

    const [href, ref] = data;

    yield put(readerLocalActionHighlights.click.build({ href, ref }));
}

export const saga = () => {

    const clickChannel = getHightlightClickChannel();
    return all([
        takeSpawnEvery(
            readerLocalActionHighlights.handler.pop.ID,
            pop,
        ),
        takeSpawnEvery(
            readerLocalActionHighlights.handler.push.ID,
            push,
        ),
        takeSpawnEvery(
            readerLocalActionLocatorHrefChanged.ID,
            hrefChanged,
        ),
        takeSpawnEveryChannel(
            clickChannel,
            dispatchClick,
        ),
    ]);
};