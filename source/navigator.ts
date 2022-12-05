/// <reference path="./_types/jquery.d.ts" />


namespace MasterDetail {
	"use strict";


	export type PageChangedEventArgs = { pageNew: AppPage, pageOld: AppPage | null };


	export class PageNavigator {
		//  Class Variables and Constants
		// -------------------------------------------------------------------
		private _htePageHost?: HTMLElement;

		private _pageCurrent?: AppPage;
		private _cacheDisplayedPages: KeyedCache<AppPage>;

		private _pageComing?: AppPage;
		private _pageWaiting?: AppPage;
		private _pageNext?: AppPage;

		private _eventPageChanged: EventNest<PageChangedEventArgs>;

		private _bPageChanging: boolean = false;

		// Construction / Initialization
		// -------------------------------------------------------------------
		constructor() {
			this._cacheDisplayedPages = new KeyedCache<AppPage>();
			this._eventPageChanged = new EventNest<PageChangedEventArgs>(this);

		}

		// Infrastructure
		// -------------------------------------------------------------------
		public assocPageHost(vePageHost: HTMLElement): void {
			vePageHost.innerHTML = "";
			this._htePageHost = vePageHost;
		}

		public updateLayout(): void {
			if (this._pageCurrent) {
				this._pageCurrent.updateLayout();
			}
		}

		// Public Members
		// -------------------------------------------------------------------
		public get current(): AppPage | undefined {
			return this._pageCurrent;
		}

		public checkPageCurrent(page: AppPage | string): boolean {
			let bCurrent: boolean = false;
			if (page && this._pageCurrent) {
				if (Helper.isString(page)) {
					bCurrent = (this._pageCurrent.uri === <string>page);
				} else {
					bCurrent = (this._pageCurrent === page);
				}
			}
			//
			return bCurrent;
		}


		public navigate(pageNavigating: AppPage): void {
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
			function processReadyPage(page: AppPage): void {
				if (page === _this._pageNext) {
					_this._setWaitingPage();
				} else {
					page.notifyRejection();
				}
			}
		}


		public forceDiscardPage(pageTarget: AppPage, pageAlternate: AppPage, bForceAlternate: boolean = false): void {
			if (this._htePageHost && this._cacheDisplayedPages.contains(pageTarget.uri)) {
				// Текущая ли страница?
				pageTarget.forceLifeMode(PageLifeModes.Discard);
				if (this.checkPageCurrent(pageTarget)) {
					this.navigate(pageAlternate);
				} else {
					this._cacheDisplayedPages.release(pageTarget.uri);
					this._htePageHost.removeChild(<HTMLElement>pageTarget.presenter);
					//
					setTimeout(() => {
						pageTarget.saveViewState();
					}, 0);
				}
			}
		}


		public get eventPageChanged(): EventNest<PageChangedEventArgs> {
			return this._eventPageChanged;
		}

		// Internal Members
		// -------------------------------------------------------------------
		private _setWaitingPage(): void {
			this._pageWaiting = this._pageNext;
			this._pageNext = undefined;
			//
			setTimeout(() => {
				if (!this._bPageChanging) {
					this._displayPage();
				}
			}, 0);
		}

		private _displayPage(): void {
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
			let htePresenterOut: HTMLElement | null = null;
			let htePresenterIn: HTMLElement | null = null;
			let eventArgs: PageChangedEventArgs = { pageNew: this._pageComing, pageOld: null };
			//
			// УДАЛЯЕМ ТЕКУЩУЮ СТРАНИЦУ
			const htePageHost: HTMLElement = <HTMLElement>this._htePageHost; // точно знаем, что презентер валидный!
			if (this._pageCurrent) {
				htePresenterOut = <HTMLElement>this._pageCurrent.presenter;
				//
				eventArgs.pageOld = this._pageCurrent;
				this._pageCurrent = undefined;
			}

			// РАЗМЕЩАЕМ НОВУЮ СТРАНИЦУ!

			this._pageCurrent = this._pageComing;
			this._pageComing = undefined;
			//
			htePresenterIn = this._pageCurrent.presenter as HTMLElement;
			//
			if (!this._cacheDisplayedPages.contains(this._pageCurrent.uri)) { // может уже присутствовать если Held
				this._cacheDisplayedPages.cache(this._pageCurrent.uri, this._pageCurrent);
				htePageHost.appendChild(htePresenterIn);

				// processContent - это единовременная обработка своих конструкций перед отображением страницы
				if (this._pageCurrent.isProcessed) {
					this._pageCurrent.notifyAttached();
				} else {
					this._pageCurrent.processContent().then(() => {
						(<AppPage>this._pageCurrent).notifyAttached();
					}, (err: any) => {
						// нужно обработать ошибку
						(<AppPage>this._pageCurrent).notifyAttached();
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
				const eDirection: TransDirections = (eventArgs.pageNew.index > eventArgs.pageOld.index) ? TransDirections.Forward : TransDirections.Backward;

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
			} else {
				htePresenterIn.classList.add("current");
				this._bPageChanging = false;
				this._checkWaitingPage();
			}

			//

			function __releasePage(ctx: PageNavigator, page: AppPage | null): void {
				if (page) {
					if (page.life !== PageLifeModes.Held) {
						page.notifyDetached();
						ctx._cacheDisplayedPages.release(page.uri);
						(<HTMLElement>ctx._htePageHost).removeChild(<HTMLElement>page.presenter);
						//
						setTimeout(() => {
							page.saveViewState();
						}, 0);
					} else {
						page.notifyPassive();
					}
				}
			} // __releasePage
		}

		private _animateTransit($pageOut: JQuery, $pageIn: JQuery, eDirection: TransDirections): Promise<any> {
			return new Promise<any>((handlComplete: any) => {
				let strOutAnimClass: string = "";
				let strInAnimClass: string = "";
				switch (eDirection) {
					case TransDirections.Forward: {
						strOutAnimClass = "trans-moveToLeft";
						strInAnimClass = "trans-moveFromRight";
						break;
					}
					case TransDirections.Backward: {
						strOutAnimClass = "trans-moveToRight";
						strInAnimClass = "trans-moveFromLeft";
						break;
					}
				}
				//
				let bOutDone: boolean = false;
				let bInDone: boolean = false;

				$pageOut.addClass(strOutAnimClass).on(Helper.strAnimEndEventName, () => {
					$pageOut.off(Helper.strAnimEndEventName);
					bOutDone = true;
					if (bInDone) {
						__onEndAnimation();
						handlComplete();
					}
				});


				$pageIn.addClass(strInAnimClass + " current").on(Helper.strAnimEndEventName, () => {
					$pageIn.off(Helper.strAnimEndEventName);
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


		private _checkWaitingPage(): void {
			setTimeout(() => {
				if (this._pageWaiting && !this._bPageChanging) {
					this._displayPage();
				}
			}, 0);
		}
	} // PageNavigator
} // namespace MasterDetailApp
