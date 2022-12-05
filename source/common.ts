namespace MasterDetail {
	"use strict";


	export enum PageLifeModes {
		Discard,
		Persistent,
		Held
	}

	export enum PageDisplayingStates {
		Outside,
		Passive,
		Active
	}

	export enum TransDirections {
		Forward,
		Backward
	}


	export abstract class Helper {

		public static get strAnimEndEventName(): string {
			// возм. надо исп. Modernizr.prefixed('animation')
			// или проверять CSS Animations support
			return "animationend";
		}

		public static hasString(str: string | undefined | null): boolean {
			return !!((str && str.length > 0)); // ???
		}

		public static isString(str: any): boolean {
			return (typeof str === "string");
		}

		public static formatString(str: string, ...args: any[]): string {
			let a = Array.prototype.slice.call(args, 0);
			return str.replace(/\{(\d+)\}/g, (match, index) => {
				const param = a[index];
				return (param) ? param.toString() : "?";
			});
		}

		public static endsWith(strSubj: string, strSearch: string, nPos?: number): boolean {
			if (nPos === undefined || nPos > strSubj.length) {
				nPos = strSubj.length;
			}
			//
			nPos -= strSearch.length;
			const lastIndex = strSubj.indexOf(strSearch, nPos);
			return lastIndex !== -1 && lastIndex === nPos;
		}


		public static isVisible(he: HTMLElement): boolean {
			return (he.offsetParent !== null);
		}

		public static canHorizontallyScroll(element: HTMLElement): boolean {
			return (window.getComputedStyle(element).overflowY === "scroll") ? (element.scrollHeight > element.clientHeight) : false;
		}

		public static isObject(obj: any): boolean {
			return (typeof obj === "object");
		}

		public static getInteger(val: any): number | null {
			if (val === undefined || val === null) {
				return null;
			}
			//
			return parseInt(val.toString(), 0);
		}
	}


	// === Toggle Full Screen Support ============================================
	// -----------------------------------------------------------------------

	export abstract class FullScreenToggler {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private static _theDoc: Document = document;
		private static _doc: any = document;
		private static _elemFullScreen?: HTMLElement = undefined;
		private static _eventChanged: Event = new Event("fullscreentoggled");
		private static _eventError: Event = new Event("fullscreenfailed");


		// Initialization
		// -------------------------------------------------------------------
		public static init(doc?: Document): void {
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
		public static getFullScreenElement(): HTMLElement {
			return (this._doc.fullscreenElement || this._doc.mozFullScreenElement || this._doc.webkitFullscreenElement);
		}

		public static isFullScreenEnabled(): boolean {
			return (this._doc.fullscreenEnabled || this._doc.mozFullScreenEnabled || this._doc.webkitFullscreenEnabled);
		}

		public static launchFullScreen(hteFullScreen: HTMLElement): void {
			if (this._elemFullScreen) {
				return;
			}
			//  
			this._elemFullScreen = hteFullScreen;
			let fse: any = hteFullScreen;
			let rqs: any;

			if (fse.requestFullscreen) {
				rqs = fse.requestFullscreen;
			} else if (fse.mozRequestFullScreen) {
				rqs = fse.mozRequestFullScreen;
			} else if (fse.webkitRequestFullscreen) {
				rqs = fse.webkitRequestFullscreen;
			}
			//
			if (rqs) {
				rqs.call(fse);
			}
		}

		public static cancelFullScreen(): void {
			if (this._doc.cancelFullScreen) {
				this._doc.cancelFullScreen();
			} else if (this._doc.mozCancelFullScreen) {
				this._doc.mozCancelFullScreen();
			} else if (this._doc.webkitCancelFullScreen) {
				this._doc.webkitCancelFullScreen();
			}
		}

		// Public Events
		// -------------------------------------------------------------------



		// Internal Members
		// -------------------------------------------------------------------



		// Event Handlers
		// -------------------------------------------------------------------
		private static _onFullScreenChange(): void {
			let elemCurrent: HTMLElement = this.getFullScreenElement();

			if (elemCurrent) {
				elemCurrent.dispatchEvent(this._eventChanged);
			} else {

				if (this._elemFullScreen) {
					this._elemFullScreen.dispatchEvent(this._eventChanged);
				}
			}
			//
			this._elemFullScreen = elemCurrent;
		}

		private static _onFullScreenError(): void {
			if (this._elemFullScreen) {
				this._elemFullScreen.dispatchEvent(this._eventError);
			}
			//
			this._elemFullScreen = undefined;
		}

	} // class FullScreenToggler


	// === Error Handling Support ============================================
	// -----------------------------------------------------------------------

	export type ErrorExplanation = { bFatal: boolean, strCaption?: string, strStack?: string };

	export class ErrorCase {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private _strMessage?: string;
		private _strCaption?: string;
		private _strStack?: string;
		private _bFatal: boolean;

		// Construction / Initialization / Destruction
		// -------------------------------------------------------------------
		constructor(source: any, expl?: ErrorExplanation) {
			if (expl) {
				this._bFatal = expl.bFatal;
				this._strCaption = expl.strCaption;
				this._strStack = expl.strStack;
			} else {
				this._bFatal = false;
				this._strCaption = "";
				this._strStack = "";
			}
			//
			this._processSource(source);
		}

		// Public Members
		// -------------------------------------------------------------------
		public getErrorDisplay(): HTMLElement {
			const hteErrorDisplay: HTMLElement = document.createElement("div");
			hteErrorDisplay.classList.add("errordisplay");

			const hteCaption: HTMLElement = document.createElement("div");
			hteCaption.classList.add("caption");
			hteErrorDisplay.appendChild(hteCaption);
			if (this._strCaption) {
				hteCaption.innerHTML = this._strCaption;
			}

			const hteMessage: HTMLElement = document.createElement("div");
			hteMessage.classList.add("message");
			hteErrorDisplay.appendChild(hteMessage);
			if (this._strMessage) {
				hteMessage.innerHTML = this._strMessage;
			}

			const hteStack: HTMLElement = document.createElement("div");
			hteStack.classList.add("stack");
			hteErrorDisplay.appendChild(hteStack);
			if (this._strStack) {
				hteStack.innerHTML = this._strStack;
			}

			return hteErrorDisplay;
		}

		// Internal Members
		// -------------------------------------------------------------------
		private _processSource(source: any) {
			try {
				if (source) {
					if (source.message) {
						this._strMessage = source.message;
					} else {
						this._strMessage = source.toString();
					}
				} else {
					this._strMessage = "?";
				}
			} catch (error) {
				this._strMessage = "[Failed to process error]";
			}
		}

	} // class ErrorCase


	// === Collections Support ===============================================
	// -----------------------------------------------------------------------

	export interface IKeyedCollection<T> {
		Add(key: string, value: T): void;
		ContainsKey(key: string): boolean;
		Count(): number;
		Item(key: string): T;
		Keys(): string[];
		Remove(key: string): T;
		Values(): T[];
	}

	export class KeyedCollection<T> implements IKeyedCollection<T> {
		private items: { [index: string]: T } = {};

		private count: number = 0;

		public ContainsKey(key: string): boolean {
			return this.items.hasOwnProperty(key);
		}

		public Count(): number {
			return this.count;
		}

		public Add(key: string, value: T): void {
			if (!this.items.hasOwnProperty(key)) {
				this.count++;
			}

			this.items[key] = value;
		}

		public Remove(key: string): T {
			let val = this.items[key];
			delete this.items[key];
			this.count--;
			return val;
		}

		public Item(key: string): T {
			return this.items[key];
		}

		public Keys(): string[] {
			let keySet: string[] = [];

			for (let prop in this.items) {
				if (this.items.hasOwnProperty(prop)) {
					keySet.push(prop);
				}
			}

			return keySet;
		}

		public Values(): T[] {
			let values: T[] = [];

			for (let prop in this.items) {
				if (this.items.hasOwnProperty(prop)) {
					values.push(this.items[prop]);
				}
			}

			return values;
		}
	}

	export class KeyedCache<T> {
		private _theCache: KeyedCollection<T>;

		constructor() {
			this._theCache = new KeyedCollection<T>();

		}

		public contains(uri: string) {
			return this._theCache.ContainsKey(uri);
		}

		public cache(uri: string, element: T) {
			if (!this._theCache.ContainsKey(uri)) {
				this._theCache.Add(uri, element);
			}
		}

		public get(uri: string): T {
			return this._theCache.Item(uri);
		}

		public retrieve(uri: string): T {
			let element = this._theCache.Item(uri);
			this._theCache.Remove(uri);
			return element;
		}

		public release(uri: string): void {
			this._theCache.Remove(uri);
		}
	}



} // namespace MasterDetail
