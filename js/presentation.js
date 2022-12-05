"use strict";
var MasterDetail;
(function (MasterDetail) {
    "use strict";
    let PageLifeModes;
    (function (PageLifeModes) {
        PageLifeModes[PageLifeModes["Discard"] = 0] = "Discard";
        PageLifeModes[PageLifeModes["Persistent"] = 1] = "Persistent";
        PageLifeModes[PageLifeModes["Held"] = 2] = "Held";
    })(PageLifeModes = MasterDetail.PageLifeModes || (MasterDetail.PageLifeModes = {}));
    let PageDisplayingStates;
    (function (PageDisplayingStates) {
        PageDisplayingStates[PageDisplayingStates["Outside"] = 0] = "Outside";
        PageDisplayingStates[PageDisplayingStates["Passive"] = 1] = "Passive";
        PageDisplayingStates[PageDisplayingStates["Active"] = 2] = "Active";
    })(PageDisplayingStates = MasterDetail.PageDisplayingStates || (MasterDetail.PageDisplayingStates = {}));
    let TransDirections;
    (function (TransDirections) {
        TransDirections[TransDirections["Forward"] = 0] = "Forward";
        TransDirections[TransDirections["Backward"] = 1] = "Backward";
    })(TransDirections = MasterDetail.TransDirections || (MasterDetail.TransDirections = {}));
    class Helper {
        static get strAnimEndEventName() {
            // возм. надо исп. Modernizr.prefixed('animation')
            // или проверять CSS Animations support
            return "animationend";
        }
        static hasString(str) {
            return !!((str && str.length > 0)); // ???
        }
        static isString(str) {
            return (typeof str === "string");
        }
        static formatString(str, ...args) {
            let a = Array.prototype.slice.call(args, 0);
            return str.replace(/\{(\d+)\}/g, (match, index) => {
                const param = a[index];
                return (param) ? param.toString() : "?";
            });
        }
        static endsWith(strSubj, strSearch, nPos) {
            if (nPos === undefined || nPos > strSubj.length) {
                nPos = strSubj.length;
            }
            //
            nPos -= strSearch.length;
            const lastIndex = strSubj.indexOf(strSearch, nPos);
            return lastIndex !== -1 && lastIndex === nPos;
        }
        static isVisible(he) {
            return (he.offsetParent !== null);
        }
        static canHorizontallyScroll(element) {
            return (window.getComputedStyle(element).overflowY === "scroll") ? (element.scrollHeight > element.clientHeight) : false;
        }
        static isObject(obj) {
            return (typeof obj === "object");
        }
        static getInteger(val) {
            if (val === undefined || val === null) {
                return null;
            }
            //
            return parseInt(val.toString(), 0);
        }
    }
    MasterDetail.Helper = Helper;
    // === Toggle Full Screen Support ============================================
    // -----------------------------------------------------------------------
    let FullScreenToggler = /** @class */ (() => {
        class FullScreenToggler {
            // Initialization
            // -------------------------------------------------------------------
            static init(doc) {
                if (doc) {
                    this._theDoc = doc;
                    this._doc = doc;
                }
                //
                this._theDoc.addEventListener("fullscreenchange", this._onFullScreenChange.bind(this), false);
                document.addEventListener("fullscreenerror", this._onFullScreenError.bind(this), false);
                document.addEventListener("mozfullscreenchange", this._onFullScreenChange.bind(this), false);
                document.addEventListener("mozfullscreenerror", this._onFullScreenError.bind(this), false);
                document.addEventListener("webkitfullscreenchange", this._onFullScreenChange.bind(this), false);
                document.addEventListener("webkitfullscreenerror", this._onFullScreenError.bind(this), false);
            }
            // Infrastructure
            // -------------------------------------------------------------------
            // Public Members
            // -------------------------------------------------------------------
            static getFullScreenElement() {
                return (this._doc.fullscreenElement || this._doc.mozFullScreenElement || this._doc.webkitFullscreenElement);
            }
            static isFullScreenEnabled() {
                return (this._doc.fullscreenEnabled || this._doc.mozFullScreenEnabled || this._doc.webkitFullscreenEnabled);
            }
            static launchFullScreen(hteFullScreen) {
                if (this._elemFullScreen) {
                    return;
                }
                //  
                this._elemFullScreen = hteFullScreen;
                let fse = hteFullScreen;
                let rqs;
                if (fse.requestFullscreen) {
                    rqs = fse.requestFullscreen;
                }
                else if (fse.mozRequestFullScreen) {
                    rqs = fse.mozRequestFullScreen;
                }
                else if (fse.webkitRequestFullscreen) {
                    rqs = fse.webkitRequestFullscreen;
                }
                //
                if (rqs) {
                    rqs.call(fse);
                }
            }
            static cancelFullScreen() {
                if (this._doc.cancelFullScreen) {
                    this._doc.cancelFullScreen();
                }
                else if (this._doc.mozCancelFullScreen) {
                    this._doc.mozCancelFullScreen();
                }
                else if (this._doc.webkitCancelFullScreen) {
                    this._doc.webkitCancelFullScreen();
                }
            }
            // Public Events
            // -------------------------------------------------------------------
            // Internal Members
            // -------------------------------------------------------------------
            // Event Handlers
            // -------------------------------------------------------------------
            static _onFullScreenChange() {
                let elemCurrent = this.getFullScreenElement();
                if (elemCurrent) {
                    elemCurrent.dispatchEvent(this._eventChanged);
                }
                else {
                    if (this._elemFullScreen) {
                        this._elemFullScreen.dispatchEvent(this._eventChanged);
                    }
                }
                //
                this._elemFullScreen = elemCurrent;
            }
            static _onFullScreenError() {
                if (this._elemFullScreen) {
                    this._elemFullScreen.dispatchEvent(this._eventError);
                }
                //
                this._elemFullScreen = undefined;
            }
        }
        // Class Variables and Constants
        // -------------------------------------------------------------------
        FullScreenToggler._theDoc = document;
        FullScreenToggler._doc = document;
        FullScreenToggler._elemFullScreen = undefined;
        FullScreenToggler._eventChanged = new Event("fullscreentoggled");
        FullScreenToggler._eventError = new Event("fullscreenfailed");
        return FullScreenToggler;
    })(); // class FullScreenToggler
    MasterDetail.FullScreenToggler = FullScreenToggler;
    class ErrorCase {
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor(source, expl) {
            if (expl) {
                this._bFatal = expl.bFatal;
                this._strCaption = expl.strCaption;
                this._strStack = expl.strStack;
            }
            else {
                this._bFatal = false;
                this._strCaption = "";
                this._strStack = "";
            }
            //
            this._processSource(source);
        }
        // Public Members
        // -------------------------------------------------------------------
        getErrorDisplay() {
            const hteErrorDisplay = document.createElement("div");
            hteErrorDisplay.classList.add("errordisplay");
            const hteCaption = document.createElement("div");
            hteCaption.classList.add("caption");
            hteErrorDisplay.appendChild(hteCaption);
            if (this._strCaption) {
                hteCaption.innerHTML = this._strCaption;
            }
            const hteMessage = document.createElement("div");
            hteMessage.classList.add("message");
            hteErrorDisplay.appendChild(hteMessage);
            if (this._strMessage) {
                hteMessage.innerHTML = this._strMessage;
            }
            const hteStack = document.createElement("div");
            hteStack.classList.add("stack");
            hteErrorDisplay.appendChild(hteStack);
            if (this._strStack) {
                hteStack.innerHTML = this._strStack;
            }
            return hteErrorDisplay;
        }
        // Internal Members
        // -------------------------------------------------------------------
        _processSource(source) {
            try {
                if (source) {
                    if (source.message) {
                        this._strMessage = source.message;
                    }
                    else {
                        this._strMessage = source.toString();
                    }
                }
                else {
                    this._strMessage = "?";
                }
            }
            catch (error) {
                this._strMessage = "[Failed to process error]";
            }
        }
    } // class ErrorCase
    MasterDetail.ErrorCase = ErrorCase;
    class KeyedCollection {
        constructor() {
            this.items = {};
            this.count = 0;
        }
        ContainsKey(key) {
            return this.items.hasOwnProperty(key);
        }
        Count() {
            return this.count;
        }
        Add(key, value) {
            if (!this.items.hasOwnProperty(key)) {
                this.count++;
            }
            this.items[key] = value;
        }
        Remove(key) {
            let val = this.items[key];
            delete this.items[key];
            this.count--;
            return val;
        }
        Item(key) {
            return this.items[key];
        }
        Keys() {
            let keySet = [];
            for (let prop in this.items) {
                if (this.items.hasOwnProperty(prop)) {
                    keySet.push(prop);
                }
            }
            return keySet;
        }
        Values() {
            let values = [];
            for (let prop in this.items) {
                if (this.items.hasOwnProperty(prop)) {
                    values.push(this.items[prop]);
                }
            }
            return values;
        }
    }
    MasterDetail.KeyedCollection = KeyedCollection;
    class KeyedCache {
        constructor() {
            this._theCache = new KeyedCollection();
        }
        contains(uri) {
            return this._theCache.ContainsKey(uri);
        }
        cache(uri, element) {
            if (!this._theCache.ContainsKey(uri)) {
                this._theCache.Add(uri, element);
            }
        }
        get(uri) {
            return this._theCache.Item(uri);
        }
        retrieve(uri) {
            let element = this._theCache.Item(uri);
            this._theCache.Remove(uri);
            return element;
        }
        release(uri) {
            this._theCache.Remove(uri);
        }
    }
    MasterDetail.KeyedCache = KeyedCache;
})(MasterDetail || (MasterDetail = {})); // namespace MasterDetail
var MasterDetail;
(function (MasterDetail) {
    "use strict";
    class EventNest {
        constructor(sender) {
            this._handlers = [];
            this._sender = sender;
        }
        // Заглушка для ситуац. когда ожидаемый объект источник события - отсутствует
        static getStub() {
            return new EventNest(null);
        }
        subscribe(handler) {
            // Один и тотже обраб. дважды и т.д. не подпишется.
            if (this._handlers.indexOf(handler) < 0) {
                this._handlers.push(handler);
            }
        }
        unsubscribe(handler) {
            let index = this._handlers.indexOf(handler);
            if (index >= 0) {
                this._handlers.splice(index, 1);
            }
        }
        // Насколько тут правильные this и т.п. - пока не ясно!
        raise(args) {
            this._handlers.forEach((handler) => {
                handler(this._sender, args);
            });
        }
    }
    MasterDetail.EventNest = EventNest;
})(MasterDetail || (MasterDetail = {})); // namespace MasterDetailApp
/// <reference path="./_types/jquery.d.ts" />
var MasterDetail;
/// <reference path="./_types/jquery.d.ts" />
(function (MasterDetail) {
    "use strict";
    class PageNavigator {
        // Construction / Initialization
        // -------------------------------------------------------------------
        constructor() {
            this._bPageChanging = false;
            this._cacheDisplayedPages = new MasterDetail.KeyedCache();
            this._eventPageChanged = new MasterDetail.EventNest(this);
        }
        // Infrastructure
        // -------------------------------------------------------------------
        assocPageHost(vePageHost) {
            vePageHost.innerHTML = "";
            this._htePageHost = vePageHost;
        }
        updateLayout() {
            if (this._pageCurrent) {
                this._pageCurrent.updateLayout();
            }
        }
        // Public Members
        // -------------------------------------------------------------------
        get current() {
            return this._pageCurrent;
        }
        checkPageCurrent(page) {
            let bCurrent = false;
            if (page && this._pageCurrent) {
                if (MasterDetail.Helper.isString(page)) {
                    bCurrent = (this._pageCurrent.uri === page);
                }
                else {
                    bCurrent = (this._pageCurrent === page);
                }
            }
            //
            return bCurrent;
        }
        navigate(pageNavigating) {
            if (this.checkPageCurrent(pageNavigating)) {
                return;
            }
            //
            const _this = this;
            this._pageNext = pageNavigating;
            pageNavigating.requestNavigation().then((pageReady) => {
                processReadyPage(pageReady);
            }, (pageCurrupted) => {
                // в любом случае отображаем
                processReadyPage(pageCurrupted);
            });
            // Inline
            function processReadyPage(page) {
                if (page === _this._pageNext) {
                    _this._setWaitingPage();
                }
                else {
                    page.notifyRejection();
                }
            }
        }
        forceDiscardPage(pageTarget, pageAlternate, bForceAlternate = false) {
            if (this._htePageHost && this._cacheDisplayedPages.contains(pageTarget.uri)) {
                // Текущая ли страница?
                pageTarget.forceLifeMode(MasterDetail.PageLifeModes.Discard);
                if (this.checkPageCurrent(pageTarget)) {
                    this.navigate(pageAlternate);
                }
                else {
                    this._cacheDisplayedPages.release(pageTarget.uri);
                    this._htePageHost.removeChild(pageTarget.presenter);
                    //
                    setTimeout(() => {
                        pageTarget.saveViewState();
                    }, 0);
                }
            }
        }
        get eventPageChanged() {
            return this._eventPageChanged;
        }
        // Internal Members
        // -------------------------------------------------------------------
        _setWaitingPage() {
            this._pageWaiting = this._pageNext;
            this._pageNext = undefined;
            //
            setTimeout(() => {
                if (!this._bPageChanging) {
                    this._displayPage();
                }
            }, 0);
        }
        _displayPage() {
            if (this._pageComing) {
                // Это ошибка!!!
                return;
            }
            if (!this._pageWaiting || !this._pageWaiting.hasPresenter) {
                // Это ошибка!!!
                return;
            }
            //
            //
            this._bPageChanging = true;
            //
            this._pageComing = this._pageWaiting;
            this._pageWaiting = undefined;
            //
            let htePresenterOut = null;
            let htePresenterIn = null;
            let eventArgs = { pageNew: this._pageComing, pageOld: null };
            //
            // УДАЛЯЕМ ТЕКУЩУЮ СТРАНИЦУ
            const htePageHost = this._htePageHost; // точно знаем, что презентер валидный!
            if (this._pageCurrent) {
                htePresenterOut = this._pageCurrent.presenter;
                //
                eventArgs.pageOld = this._pageCurrent;
                this._pageCurrent = undefined;
            }
            // РАЗМЕЩАЕМ НОВУЮ СТРАНИЦУ!
            this._pageCurrent = this._pageComing;
            this._pageComing = undefined;
            //
            htePresenterIn = this._pageCurrent.presenter;
            //
            if (!this._cacheDisplayedPages.contains(this._pageCurrent.uri)) { // может уже присутствовать если Held
                this._cacheDisplayedPages.cache(this._pageCurrent.uri, this._pageCurrent);
                htePageHost.appendChild(htePresenterIn);
                // processContent - это единовременная обработка своих конструкций перед отображением страницы
                if (this._pageCurrent.isProcessed) {
                    this._pageCurrent.notifyAttached();
                }
                else {
                    this._pageCurrent.processContent().then(() => {
                        this._pageCurrent.notifyAttached();
                    }, (err) => {
                        // нужно обработать ошибку
                        this._pageCurrent.notifyAttached();
                    });
                }
            }
            this._pageCurrent.notifyCurrent();
            // ОТОБРАЖАЕМ ПЕРЕХОД МЕЖДУ СТРАНИЦАМИ!
            eventArgs.pageNew = this._pageCurrent;
            this._eventPageChanged.raise(eventArgs); // факт. смена страниц произошла - сообщаем (возм. надо raiseAsync)
            //
            if (htePresenterOut && eventArgs.pageOld) {
                // раз есть предыдущ. страница - надо анимировать переход
                const eDirection = (eventArgs.pageNew.index > eventArgs.pageOld.index) ? MasterDetail.TransDirections.Forward : MasterDetail.TransDirections.Backward;
                /*
                Вот так можно создать глюк (анимация не работает)
                (<HTMLElement>this._htePageHost).removeChild(htePresenterOut);
                но как обработать такую ситуацию - ПОКА НЕПОНЯТНО!
                Пока без проверки на глюк.
                */
                this._animateTransit($(htePresenterOut), $(htePresenterIn), eDirection).then(() => {
                    __releasePage(this, eventArgs.pageOld);
                    this._bPageChanging = false;
                    this._checkWaitingPage();
                });
            }
            else {
                htePresenterIn.classList.add("current");
                this._bPageChanging = false;
                this._checkWaitingPage();
            }
            //
            function __releasePage(ctx, page) {
                if (page) {
                    if (page.life !== MasterDetail.PageLifeModes.Held) {
                        page.notifyDetached();
                        ctx._cacheDisplayedPages.release(page.uri);
                        ctx._htePageHost.removeChild(page.presenter);
                        //
                        setTimeout(() => {
                            page.saveViewState();
                        }, 0);
                    }
                    else {
                        page.notifyPassive();
                    }
                }
            } // __releasePage
        }
        _animateTransit($pageOut, $pageIn, eDirection) {
            return new Promise((handlComplete) => {
                let strOutAnimClass = "";
                let strInAnimClass = "";
                switch (eDirection) {
                    case MasterDetail.TransDirections.Forward: {
                        strOutAnimClass = "trans-moveToLeft";
                        strInAnimClass = "trans-moveFromRight";
                        break;
                    }
                    case MasterDetail.TransDirections.Backward: {
                        strOutAnimClass = "trans-moveToRight";
                        strInAnimClass = "trans-moveFromLeft";
                        break;
                    }
                }
                //
                let bOutDone = false;
                let bInDone = false;
                $pageOut.addClass(strOutAnimClass).on(MasterDetail.Helper.strAnimEndEventName, () => {
                    $pageOut.off(MasterDetail.Helper.strAnimEndEventName);
                    bOutDone = true;
                    if (bInDone) {
                        __onEndAnimation();
                        handlComplete();
                    }
                });
                $pageIn.addClass(strInAnimClass + " current").on(MasterDetail.Helper.strAnimEndEventName, () => {
                    $pageIn.off(MasterDetail.Helper.strAnimEndEventName);
                    bInDone = true;
                    if (bOutDone) {
                        __onEndAnimation();
                        handlComplete();
                    }
                });
                //
                // 
                function __onEndAnimation() {
                    bOutDone = false;
                    bInDone = false;
                    //
                    $pageOut.attr("class", $pageOut.data("origClasses"));
                    $pageIn.attr("class", $pageIn.data("origClasses") + " current");
                }
            });
        }
        _checkWaitingPage() {
            setTimeout(() => {
                if (this._pageWaiting && !this._bPageChanging) {
                    this._displayPage();
                }
            }, 0);
        }
    } // PageNavigator
    MasterDetail.PageNavigator = PageNavigator;
})(MasterDetail || (MasterDetail = {})); // namespace MasterDetailApp
/// <reference path="./_types/jquery.d.ts" />
/// <reference path="./navigator.ts" />
var MasterDetail;
/// <reference path="./_types/jquery.d.ts" />
/// <reference path="./navigator.ts" />
(function (MasterDetail) {
    "use strict";
    let MainView = /** @class */ (() => {
        class MainView /* implements IPageNavigation */ {
            // Infrastructure
            // -------------------------------------------------------------------
            static launch(path) {
                //
                if (this._testCompatibility()) {
                    //
                    // Full Screen Prepare
                    this._$btnToggleScreen = $(".app-frame header #btnScreenToggle");
                    this._$btnToggleScreen.on("click", this._toggleFullScreen);
                    document.documentElement.addEventListener("fullscreentoggled", this._onFullScreenToggled.bind(this), false);
                    document.documentElement.addEventListener("fullscreenfailed", this._onFullScreenError.bind(this), false);
                    //
                    this._$title = $(".app-frame>header > .title");
                    //
                    this._$navpanel = $(".app-frame .navpanel");
                    this._$navpanel.find("button").on("click", this._onNavpanelClick.bind(this));
                    //
                    this._$pagesPanel = $(".app-frame #divPageSelectPanel");
                    if (this._$pagesPanel && this._$pagesPanel.length === 1) {
                        this._$pageRefs = this._$pagesPanel.find("#pnlPages>div");
                        this._$pageRefs.on("click", this._onPageThumbClick.bind(this));
                        this._preparePageThumbs(this._$pageRefs);
                        setTimeout(() => {
                            this._$pagesPanel.css("display", "flex");
                        }, 1000);
                        //
                        let hteCloseBtn = this._$pagesPanel.find("#btnClose").get(0);
                        $(hteCloseBtn).on("click touchstart", () => {
                            this.isPagesPanelVisible = false;
                        });
                    }
                    //
                    this._presenter = document.querySelector(".app-mainview");
                    if (this._presenter) {
                        // !!! Надо не app-mainview а pagehost (нужно ввести и он долж быть container)
                        this._nav.assocPageHost(this._presenter);
                        this._nav.eventPageChanged.subscribe(this._onPageChanged.bind(this));
                        //
                        MasterDetail.FullScreenToggler.init(document);
                        //
                        let $splashscreen = $(".app-splashscreen");
                        setTimeout(() => {
                            $splashscreen.fadeOut("slow", () => {
                                $splashscreen.css("display", "none");
                            });
                        }, 1000);
                    }
                    //
                    window.addEventListener("resize", (event) => {
                        this.isPagesPanelVisible = false;
                    });
                    //
                    // Загружаем главную страницу
                    //
                    this.toMasterPage();
                }
                else {
                    // Браузер устаревший!
                    const strScreenHTML = `<div class="app-incompatible"> 
<div class="message">Извините, ваш браузер не совместим с данным приложением!<br/>
Попробуйте воспользоваться другим браузером.</div>
</div>`;
                    if (document.body) {
                        document.body.innerHTML = strScreenHTML;
                    }
                }
            }
            // Public Members
            // -------------------------------------------------------------------
            static showTitle(strTitle) {
                if (this._$title) {
                    this._$title.hide();
                    this._$title.text(strTitle);
                    this._$title.fadeIn();
                }
            }
            static toMasterPage() {
                this.toPage(0);
            }
            static toPage(nPageIndex) {
                const refPage = this._$pageRefs.get(nPageIndex);
                const strPath = refPage.dataset.uri;
                if (strPath) {
                    let page;
                    if (this._cachePages.contains(strPath)) {
                        page = this._cachePages.get(strPath);
                    }
                    else {
                        if (nPageIndex === 0) {
                            page = new MasterDetail.MasterPage(strPath);
                        }
                        else {
                            page = new MasterDetail.PresnPage(nPageIndex, strPath);
                        }
                        //
                        if (page && page.life !== MasterDetail.PageLifeModes.Discard) {
                            this._cachePages.cache(strPath, page); // кешируем постоянную страницу.
                        }
                    }
                    //
                    this.showTitle("");
                    this._nav.navigate(page);
                }
            }
            // Public Events
            // -------------------------------------------------------------------
            // Internal Members
            // -------------------------------------------------------------------
            static _testCompatibility() {
                let test = window.Modernizr;
                if (test) {
                    if (!test.cssanimations) {
                        // alert("CSS Animations not support!");
                        return false;
                    }
                    //
                    if (!test.video) {
                        // alert("HTML5 Video not support!");
                        return false;
                    }
                }
                //
                return true;
            }
            // новая версия
            static _preparePageThumbs($thumbs) {
                $thumbs.each((index, hteThumb) => {
                    let oSvgContainer = hteThumb.firstElementChild;
                    oSvgContainer.dataset.index = (index + 1).toString();
                    //
                    if (oSvgContainer) {
                        let svgDocNow = oSvgContainer.getSVGDocument();
                        if (svgDocNow) {
                            let textNow = svgDocNow.getElementById("text");
                            if (textNow) {
                                textNow.innerHTML = oSvgContainer.dataset.index;
                            }
                        }
                        oSvgContainer.addEventListener("load", (ev) => {
                            let current = ev.currentTarget;
                            let svgDoc = current.getSVGDocument();
                            let text = svgDoc.getElementById("text");
                            if (text) {
                                text.innerHTML = current.dataset.index;
                            }
                        });
                    }
                });
            }
            // Event Handlers
            // -------------------------------------------------------------------
            static _onPageThumbClick(ev) {
                if (ev.currentTarget) {
                    let nSenderIndex = $(ev.currentTarget).index();
                    this.toPage(nSenderIndex); // этот индекс должен совпадать с индексом в AppPage
                }
            }
            static _onPageChanged(sender, args) {
                if (args.pageOld) {
                    this._$pageRefs.get(args.pageOld.index).classList.remove("current");
                }
                //
                if (args.pageNew) {
                    this._nCurrentPageIndex = args.pageNew.index;
                    this._$pageRefs.get(args.pageNew.index).classList.add("current");
                }
            }
            static _onNavpanelClick(ev) {
                switch (ev.currentTarget.id) {
                    case "btnNavPages": {
                        this.isPagesPanelVisible = !this.isPagesPanelVisible;
                        break;
                    }
                    case "btnNavFirst": {
                        if (this._$pageRefs.length > 0 && this._nCurrentPageIndex !== 0) {
                            this.toPage(0);
                        }
                        break;
                    }
                    case "btnNavPrev": {
                        if (this._$pageRefs.length > 0 && this._nCurrentPageIndex > 0) {
                            this.toPage(this._nCurrentPageIndex - 1);
                        }
                        break;
                    }
                    case "btnNavNext": {
                        if (this._nCurrentPageIndex < (this._$pageRefs.length - 1)) {
                            const nNewPageIndex = this._nCurrentPageIndex + 1;
                            this.toPage(nNewPageIndex);
                        }
                        break;
                    }
                    case "btnNavLast": {
                        if (this._nCurrentPageIndex < (this._$pageRefs.length - 1)) {
                            this.toPage(this._$pageRefs.length - 1);
                        }
                        break;
                    }
                }
            }
            // Full Screen Support
            // -------------------------------------------------------------------
            static _toggleFullScreen() {
                if (MasterDetail.FullScreenToggler.getFullScreenElement()) {
                    MasterDetail.FullScreenToggler.cancelFullScreen();
                }
                else {
                    MasterDetail.FullScreenToggler.launchFullScreen(document.documentElement);
                }
            }
            static _onFullScreenToggled(ev) {
                if (this._$btnToggleScreen) {
                    if (MasterDetail.FullScreenToggler.getFullScreenElement()) {
                        this._$btnToggleScreen.addClass("restorescreen");
                    }
                    else {
                        this._$btnToggleScreen.removeClass("restorescreen");
                    }
                }
            }
            static _onFullScreenError(ev) {
                // BookRT.Diagnostics.logError(new WinJS.ErrorFromName("FullScreenError", "full screen error has occurred " + ev.target));
            }
            // Pages Panel
            // -------------------------------------------------------------------
            static get isPagesPanelVisible() {
                return this._isPagesPanelVisible;
            }
            static set isPagesPanelVisible(bVisible) {
                if (this._$pagesPanel.length > 0 && bVisible !== this._isPagesPanelVisible) {
                    if (bVisible === true) {
                        let nMoveValue = 10;
                        let nTop = this._positionPagesPanel(nMoveValue);
                        if (nTop) {
                            this._isPagesPanelVisible = true;
                            this._$pagesPanel.addClass("opened");
                        }
                    }
                    else {
                        this._isPagesPanelVisible = false;
                        this._$pagesPanel.removeClass("opened");
                    }
                }
            }
            static _positionPagesPanel(nMoveValue) {
                if (!nMoveValue) {
                    nMoveValue = 0;
                }
                //
                if (this._$navpanel) {
                    let offsetNavPanel = this._$navpanel.offset();
                    let offsetPagePanel = this._$pagesPanel.offset();
                    let nPanelHeight = this._$pagesPanel.height();
                    if (offsetNavPanel && nPanelHeight) {
                        let topNew = (offsetNavPanel.top - nPanelHeight);
                        this._$pagesPanel.offset({ top: topNew });
                        return topNew;
                    }
                }
                //
                return null;
            }
        }
        // Class Variables and Constants
        // -------------------------------------------------------------------
        MainView._nav = new MasterDetail.PageNavigator();
        MainView._cachePages = new MasterDetail.KeyedCache();
        MainView._isPagesPanelVisible = false;
        MainView._nCurrentPageIndex = 0;
        return MainView;
    })(); // class MainView
    MasterDetail.MainView = MainView;
})(MasterDetail || (MasterDetail = {})); // namespace MasterDetailApp
/// <reference path="./_types/jquery.d.ts"/>
var MasterDetail;
/// <reference path="./_types/jquery.d.ts"/>
(function (MasterDetail) {
    "use strict";
    class AppPage {
        // Construction / Initialization
        // -------------------------------------------------------------------
        constructor(nPageIndex, uri, life = MasterDetail.PageLifeModes.Discard) {
            this._doRestoreState = undefined;
            this._onProcessed = undefined;
            this._nIndex = nPageIndex;
            this._presenter = null;
            this._bProcessed = false;
            //
            this._uri = uri;
            this._eLifeMode = life;
            this._stateDisplaying = MasterDetail.PageDisplayingStates.Outside;
            this._eventStateChanged = new MasterDetail.EventNest(this);
        }
        // Infrastructure
        // -------------------------------------------------------------------
        get isProcessed() {
            return this._bProcessed;
        }
        processContent() {
            const _this = this;
            return new Promise((handComplete, handError) => {
                handComplete();
            });
        }
        markError(error) {
            this._errorCase = error;
            if (this._errorCase) {
                this._applyErrorState(this._errorCase);
            }
        }
        // INavPage Implementation
        // -------------------------------------------------------------------
        get presenter() {
            return this._presenter;
        }
        get hasPresenter() {
            return !!this._presenter;
        }
        get uri() {
            return this._uri;
        }
        get tag() {
            return this._tag;
        }
        set tag(value) {
            this._tag = value;
        }
        requestNavigation() {
            let _this = this;
            return new Promise((completeReadyHandler, errorReadyHandler) => {
                if (_this._presenter) {
                    // пока просто жёстко
                    completeReadyHandler(_this);
                }
                else {
                    let presenter = createPresenter();
                    //
                    $(presenter).load(_this._uri, (response, status, xhr) => {
                        if (status === "error") {
                            let msg = "Error loading App Templates: " + xhr.status + " " + xhr.statusText;
                            _this.markError(new MasterDetail.ErrorCase(msg));
                            _this._setPresenter(presenter);
                            errorReadyHandler(_this);
                        }
                        else {
                            _this._setPresenter(presenter);
                            completeReadyHandler(_this);
                        }
                    });
                }
            });
            // inline Function
            function createPresenter() {
                let element = document.createElement("div");
                element.classList.add("page-presenter");
                return element;
            }
        }
        notifyAttached() {
            //
        }
        notifyCurrent() {
            if (!this.hasError) {
                let hteTitle = this.presenter.querySelector("title");
                if (hteTitle) {
                    MasterDetail.MainView.showTitle(hteTitle.innerHTML);
                }
            }
        }
        notifyActive() {
            this._changeState(MasterDetail.PageDisplayingStates.Active);
        }
        notifyPassive() {
            this._changeState(MasterDetail.PageDisplayingStates.Passive);
        }
        notifyRejection() {
            this._changeState(MasterDetail.PageDisplayingStates.Outside);
            //
            if (this._eLifeMode === MasterDetail.PageLifeModes.Discard) { // код не завершённый - нужна более сложная проверка на персист.
                this._releasePresenter();
            }
            else {
                //
            }
        }
        saveViewState() {
            //
        }
        notifyDetached() {
            this._changeState(MasterDetail.PageDisplayingStates.Outside);
            //
            // оповещ. о уходе со страницы 
            // здесь нужно проверять, явл. ли страница постоянной, и если нет, то запускать механизм её отложенной выгрузки.
            if (this._eLifeMode === MasterDetail.PageLifeModes.Discard) { // код не завершённый - нужна более сложная проверка на персист.
                this._releasePresenter();
            }
        }
        get hasError() {
            return (!!this._errorCase);
        }
        get error() {
            return (this._errorCase) ? this._errorCase : null;
        }
        get life() {
            return this._eLifeMode;
        }
        get state() {
            return this._stateDisplaying;
        }
        get eventStateChanged() {
            return this._eventStateChanged;
        }
        updateLayout() {
            //
        }
        // Public Members
        // -------------------------------------------------------------------
        get index() {
            return this._nIndex;
        }
        forceLifeMode(mode) {
            this._eLifeMode = mode;
        }
        // Virtuals
        // -------------------------------------------------------------------
        // protected _onPresenterCreated?: (vePresenter: HTMLElement) => void = undefined;
        _onPresenterCreated(vePresenter) {
            if (this._errorCase) {
                this._applyErrorState(this._errorCase);
            }
        }
        // Internal Members
        // -------------------------------------------------------------------
        _setPresenter(htePresenter) {
            this._presenter = htePresenter;
            //
            htePresenter.dataset.origClasses = htePresenter.className;
            //
            if (this._errorCase) {
                this._applyErrorState(this._errorCase);
            }
            else {
                this._onPresenterCreated(this._presenter);
            }
        }
        _releasePresenter() {
            delete this._presenter;
            this._bProcessed = false;
        }
        _applyErrorState(error) {
            if (this.hasPresenter) {
                const presenter = this._presenter;
                presenter.innerHTML = "";
                presenter.classList.add("app-error");
                presenter.appendChild(error.getErrorDisplay());
            }
        }
        _raiseProcessed() {
            this._bProcessed = true; // в люб. случ. считаем страницу обработанной
            setTimeout(() => {
                if (this._onProcessed) {
                    this._onProcessed();
                }
                //
                if (this._doRestoreState) {
                    this._doRestoreState();
                }
            }, 0);
        }
        // Event Handlers
        // -------------------------------------------------------------------
        // State Machine
        // -------------------------------------------------------------------
        _changeState(stateNew) {
            const stateOld = this._stateDisplaying;
            this._stateDisplaying = stateNew;
            //
            switch (this._stateDisplaying) {
                case MasterDetail.PageDisplayingStates.Outside: {
                    break;
                }
                case MasterDetail.PageDisplayingStates.Passive: {
                    break;
                }
                case MasterDetail.PageDisplayingStates.Active: {
                    break;
                }
            }
            //
            if (this._stateDisplaying !== stateOld) {
                this._eventStateChanged.raise(this._stateDisplaying);
            }
        }
    } // class AppPage
    MasterDetail.AppPage = AppPage;
    class MasterPage extends AppPage {
        // Class Variables and Constants
        // -------------------------------------------------------------------
        // Construction / Initialization
        // -------------------------------------------------------------------
        constructor(uri) {
            super(0, uri, MasterDetail.PageLifeModes.Held);
        }
        // Public Members
        // -------------------------------------------------------------------
        // Overrides
        // -------------------------------------------------------------------
        _onPresenterCreated(htePresenter) {
            super._onPresenterCreated(htePresenter);
            //
            if (!this.hasError) {
                $("#btnToPresn", htePresenter).on("click", () => {
                    MasterDetail.MainView.toPage(1);
                });
            }
        }
    } // class MasterPage
    MasterDetail.MasterPage = MasterPage;
    class PresnPage extends AppPage {
        // Construction / Initialization
        // -------------------------------------------------------------------
        constructor(nPageIndex, uri, life = MasterDetail.PageLifeModes.Persistent) {
            super(nPageIndex, uri, life);
            // Class Variables and Constants
            // -------------------------------------------------------------------
            this._$presenter = null;
            this._$HorzScrollIndicator = null;
            this._$elemHorzScroll = null;
            //
        }
        // Overrides
        // -------------------------------------------------------------------
        _onPresenterCreated(htePresenter) {
            super._onPresenterCreated(htePresenter);
            //
            this._$presenter = $(htePresenter);
            // Есть ли индикатор горизонт. прокрутки?
            // const hteHorzPointer: HTMLElement | null = htePresenter.querySelector(".horzscrollpointer");
            // if (hteHorzPointer) {
            // 	// есть! 
            // 	this._processHorzPointer($(hteHorzPointer));
            // }
        }
        // Overrides
        // -------------------------------------------------------------------
        notifyCurrent() {
            super.notifyCurrent();
            //
            if (!this.hasError) {
                const hteHorzPointer = this._presenter.querySelector(".horzscrollpointer");
                if (hteHorzPointer) {
                    // есть! 
                    this._processHorzPointer($(hteHorzPointer));
                }
            }
        }
        // Internal Members
        // -------------------------------------------------------------------
        _processHorzPointer($HorzScrollIndicator) {
            $HorzScrollIndicator.hide();
            //
            this._$HorzScrollIndicator = $HorzScrollIndicator;
            this._$elemHorzScroll = $($HorzScrollIndicator.get(0).parentElement);
            //
            if (this._$presenter) {
                this._$presenter.on("resize scroll", this._onOwnerScroll.bind(this));
            }
        }
        _displayHorzPointer($pointer) {
            $pointer.show(1000, () => {
                setTimeout(() => {
                    $pointer.hide(1000);
                }, 3500);
            });
        }
        _checkInViewport($elem) {
            let bSatisfy = false;
            //
            const nViewportTop = this._$presenter.scrollTop();
            const nViewportHeight = this._$presenter.height();
            if (nViewportTop && nViewportHeight) {
                const nViewportBottom = nViewportTop + nViewportHeight;
                //
                const nElemTop = $elem.offset().top;
                const nElemHeight = $elem.outerHeight();
                const nElemBottom = nElemTop + nElemHeight;
                //
                const nElemLedge = nElemBottom - nViewportBottom;
                bSatisfy = (nElemLedge < (nElemHeight / 2));
            }
            //
            return bSatisfy;
        }
        // Event Handlers
        // -------------------------------------------------------------------
        _onOwnerScroll(ev) {
            setTimeout(() => {
                if (this._$HorzScrollIndicator && this._$elemHorzScroll) {
                    if (this._checkInViewport(this._$elemHorzScroll)) {
                        const $pointer = this._$HorzScrollIndicator;
                        const $elemHorzScroll = this._$elemHorzScroll;
                        this._$HorzScrollIndicator = null;
                        this._$elemHorzScroll = null;
                        //
                        // А теперь вопрос - нужен ли вообще индикатор?
                        const nElemHorzScrollWidth = $elemHorzScroll.width();
                        const $ScrollContent = $elemHorzScroll.find(".scrollcontent");
                        if ($ScrollContent) {
                            const nScrollContentWidth = $ScrollContent.width();
                            if (nScrollContentWidth && nElemHorzScrollWidth) {
                                if (nScrollContentWidth > nElemHorzScrollWidth) {
                                    // Да, контент элемента imageline не умещается по ширине!
                                    this._displayHorzPointer($pointer);
                                }
                            }
                        } // if ($ScrollContent)
                    }
                }
            }, 0);
        }
    } // class DetailPage
    MasterDetail.PresnPage = PresnPage;
})(MasterDetail || (MasterDetail = {})); // namespace MasterDetail
//# sourceMappingURL=presentation.js.map