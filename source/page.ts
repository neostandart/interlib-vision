/// <reference path="./_types/jquery.d.ts"/>


namespace MasterDetail {
	"use strict";


	export class AppPage {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		protected _uri: string;
		protected _nIndex: number;
		protected _eLifeMode: MasterDetail.PageLifeModes;
		protected _presenter: HTMLDivElement | null;
		private _bProcessed: boolean; // Один раз после первого присоед. презентера к DOM
		//
		protected _stateDisplaying: MasterDetail.PageDisplayingStates;
		private _eventStateChanged: EventNest<MasterDetail.PageDisplayingStates>;
		//
		protected _errorCase?: MasterDetail.ErrorCase;
		private _tag: any;

		// Construction / Initialization
		// -------------------------------------------------------------------
		constructor(nPageIndex: number, uri: string, life: PageLifeModes = PageLifeModes.Discard) {
			this._nIndex = nPageIndex;
			this._presenter = null;
			this._bProcessed = false;
			//
			this._uri = uri;
			this._eLifeMode = life;

			this._stateDisplaying = MasterDetail.PageDisplayingStates.Outside;
			this._eventStateChanged = new EventNest<MasterDetail.PageDisplayingStates>(this);
		}

		// Infrastructure
		// -------------------------------------------------------------------
		public get isProcessed(): boolean {
			return this._bProcessed;
		}

		public processContent(): Promise<any> {
			const _this: AppPage = this;
			return new Promise<any>((handComplete: any, handError: any) => {
				handComplete();
			});
		}

		public markError(error: MasterDetail.ErrorCase): void {
			this._errorCase = error;
			if (this._errorCase) {
				this._applyErrorState(this._errorCase);
			}
		}


		// INavPage Implementation
		// -------------------------------------------------------------------
		public get presenter(): HTMLDivElement | null {
			return this._presenter;
		}

		public get hasPresenter(): boolean {
			return !!this._presenter;
		}


		public get uri(): string {
			return this._uri;
		}

		public get tag(): any | undefined {
			return this._tag;
		}
		public set tag(value: any | undefined) {
			this._tag = value;
		}

		public requestNavigation(): Promise<AppPage> {
			let _this: AppPage = this;
			return new Promise<AppPage>((completeReadyHandler: any, errorReadyHandler: any) => {
				if (_this._presenter) {
					// пока просто жёстко
					completeReadyHandler(_this);
				} else {
					let presenter: HTMLDivElement = createPresenter();
					//
					$(presenter).load(_this._uri, (response, status, xhr) => {
						if (status === "error") {
							let msg = "Error loading App Templates: " + xhr.status + " " + xhr.statusText;
							_this.markError(new ErrorCase(msg));
							_this._setPresenter(presenter);
							errorReadyHandler(_this);
						} else {
							_this._setPresenter(presenter);
							completeReadyHandler(_this);
						}
					});
				}
			});

			// inline Function
			function createPresenter(): HTMLDivElement {
				let element: HTMLDivElement = document.createElement("div");
				element.classList.add("page-presenter");
				return element;
			}
		}

		public notifyAttached(): void {
			//
		}


		public notifyCurrent(): void {
			if (!this.hasError) {
				let hteTitle: HTMLTitleElement = <HTMLTitleElement>(<HTMLElement>this.presenter).querySelector("title");
				if (hteTitle) {
					MainView.showTitle(hteTitle.innerHTML);
				}
			}
		}


		public notifyActive(): void {
			this._changeState(MasterDetail.PageDisplayingStates.Active);
		}

		public notifyPassive(): void {
			this._changeState(MasterDetail.PageDisplayingStates.Passive);
		}


		public notifyRejection(): void {
			this._changeState(MasterDetail.PageDisplayingStates.Outside);
			//
			if (this._eLifeMode === MasterDetail.PageLifeModes.Discard) { // код не завершённый - нужна более сложная проверка на персист.
				this._releasePresenter();
			} else {
				//
			}

		}

		public saveViewState(): void {
			//
		}

		public notifyDetached(): void {
			this._changeState(MasterDetail.PageDisplayingStates.Outside);
			//
			// оповещ. о уходе со страницы 
			// здесь нужно проверять, явл. ли страница постоянной, и если нет, то запускать механизм её отложенной выгрузки.
			if (this._eLifeMode === MasterDetail.PageLifeModes.Discard) { // код не завершённый - нужна более сложная проверка на персист.
				this._releasePresenter();
			}
		}

		public get hasError(): boolean {
			return (!!this._errorCase);
		}

		public get error(): ErrorCase | null {
			return (this._errorCase) ? this._errorCase : null;
		}

		public get life(): MasterDetail.PageLifeModes {
			return this._eLifeMode;
		}

		public get state(): MasterDetail.PageDisplayingStates {
			return this._stateDisplaying;
		}

		public get eventStateChanged(): EventNest<PageDisplayingStates> {
			return this._eventStateChanged;
		}

		public updateLayout(): void {
			//
		}

		// Public Members
		// -------------------------------------------------------------------
		public get index(): number {
			return this._nIndex;
		}

		public forceLifeMode(mode: MasterDetail.PageLifeModes): void {
			this._eLifeMode = mode;
		}

		// Virtuals
		// -------------------------------------------------------------------
		// protected _onPresenterCreated?: (vePresenter: HTMLElement) => void = undefined;

		protected _onPresenterCreated(vePresenter: HTMLElement): void {
			if (this._errorCase) {
				this._applyErrorState(this._errorCase);
			}
		}


		protected _doRestoreState?: () => void = undefined;
		protected _onProcessed?: () => void = undefined;

		// Internal Members
		// -------------------------------------------------------------------
		protected _setPresenter(htePresenter: HTMLDivElement): void {
			this._presenter = htePresenter;
			//
			htePresenter.dataset.origClasses = htePresenter.className;
			//
			if (this._errorCase) {
				this._applyErrorState(this._errorCase);
			} else {
				this._onPresenterCreated(this._presenter);
			}
		}

		protected _releasePresenter(): void {
			delete this._presenter;
			this._bProcessed = false;
		}

		protected _applyErrorState(error: ErrorCase) {
			if (this.hasPresenter) {
				const presenter: HTMLElement = <HTMLElement>this._presenter;
				presenter.innerHTML = "";
				presenter.classList.add("app-error");
				presenter.appendChild(error.getErrorDisplay());
			}
		}

		protected _raiseProcessed() {
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
		private _changeState(stateNew: MasterDetail.PageDisplayingStates): void {
			const stateOld: MasterDetail.PageDisplayingStates = this._stateDisplaying;
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



	export class MasterPage extends AppPage {
		// Class Variables and Constants
		// -------------------------------------------------------------------


		// Construction / Initialization
		// -------------------------------------------------------------------
		constructor(uri: string) {
			super(0, uri, PageLifeModes.Held);

		}


		// Public Members
		// -------------------------------------------------------------------



		// Overrides
		// -------------------------------------------------------------------
		protected _onPresenterCreated(htePresenter: HTMLElement): void {
			super._onPresenterCreated(htePresenter);
			//
			if (!this.hasError) {
				$("#btnToPresn", htePresenter).on("click", () => {
					MainView.toPage(1);
				});
			}
		}


		// Internal Members
		// -------------------------------------------------------------------


		// Event Handlers
		// -------------------------------------------------------------------



	} // class MasterPage



	export class PresnPage extends AppPage {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private _$presenter: JQuery | null = null;
		private _$HorzScrollIndicator: JQuery | null = null;
		private _$elemHorzScroll: JQuery | null = null;


		// Construction / Initialization
		// -------------------------------------------------------------------
		constructor(nPageIndex: number, uri: string, life: PageLifeModes = PageLifeModes.Persistent) {
			super(nPageIndex, uri, life);
			//
		}

		// Overrides
		// -------------------------------------------------------------------
		protected _onPresenterCreated(htePresenter: HTMLElement): void {
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

		public notifyCurrent(): void {
			super.notifyCurrent();
			//
			if (!this.hasError) {
				const hteHorzPointer: HTMLElement | null = (<HTMLElement>this._presenter).querySelector(".horzscrollpointer");
				if (hteHorzPointer) {
					// есть! 
					this._processHorzPointer($(hteHorzPointer));
				}
			}
		}



		// Internal Members
		// -------------------------------------------------------------------
		private _processHorzPointer($HorzScrollIndicator: JQuery): void {
			$HorzScrollIndicator.hide();
			//
			this._$HorzScrollIndicator = $HorzScrollIndicator;
			this._$elemHorzScroll = $($HorzScrollIndicator.get(0).parentElement as HTMLElement);
			//
			if (this._$presenter) {
				this._$presenter.on("resize scroll", this._onOwnerScroll.bind(this));
			}
		}

		private _displayHorzPointer($pointer: JQuery) {
			$pointer.show(1000, () => {
				setTimeout(() => {
					$pointer.hide(1000);
				}, 3500);
			});
		}

		private _checkInViewport($elem: JQuery): boolean {
			let bSatisfy = false;
			//
			const nViewportTop: number | undefined = (this._$presenter as JQuery).scrollTop();
			const nViewportHeight: number | undefined = (this._$presenter as JQuery).height();
			if (nViewportTop && nViewportHeight) {
				const nViewportBottom = nViewportTop + nViewportHeight;
				//
				const nElemTop: number = ($elem.offset() as JQuery.Coordinates).top;
				const nElemHeight: number = $elem.outerHeight() as number;
				const nElemBottom: number = nElemTop + nElemHeight;
				//
				const nElemLedge = nElemBottom - nViewportBottom;
				bSatisfy = (nElemLedge < (nElemHeight / 2));
			}
			//
			return bSatisfy;
		}

		// Event Handlers
		// -------------------------------------------------------------------
		private _onOwnerScroll(ev: Event): void {
			setTimeout(() => {
				if (this._$HorzScrollIndicator && this._$elemHorzScroll) {
					if (this._checkInViewport(this._$elemHorzScroll)) {
						const $pointer: JQuery = this._$HorzScrollIndicator;
						const $elemHorzScroll: JQuery = this._$elemHorzScroll;

						this._$HorzScrollIndicator = null;
						this._$elemHorzScroll = null;
						//
						// А теперь вопрос - нужен ли вообще индикатор?
						const nElemHorzScrollWidth: number | undefined = $elemHorzScroll.width();
						const $ScrollContent: JQuery = $elemHorzScroll.find(".scrollcontent");
						if ($ScrollContent) {
							const nScrollContentWidth: number | undefined = $ScrollContent.width();
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

} // namespace MasterDetail
