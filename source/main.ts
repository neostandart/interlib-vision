/// <reference path="./_types/jquery.d.ts" />
/// <reference path="./navigator.ts" />


namespace MasterDetail {
	"use strict";

	export abstract class MainView /* implements IPageNavigation */ {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private static _nav: PageNavigator = new PageNavigator();
		private static _$btnToggleScreen?: JQuery;
		private static _presenter: HTMLDivElement | null;

		private static _cachePages: KeyedCache<AppPage> = new KeyedCache<AppPage>();

		private static _$title: JQuery;
		private static _$navpanel: JQuery;
		private static _$pagesPanelToggler: JQuery;
		private static _$pagesPanel: JQuery;
		private static _$pageRefs: JQuery;
		private static _isPagesPanelVisible: boolean = false;

		private static _nCurrentPageIndex: number = 0;



		// Infrastructure
		// -------------------------------------------------------------------
		public static launch(path: string): void {
			//
			if (this._testCompatibility()) {
				//
				// Full Screen Prepare
				this._$btnToggleScreen = $(".app-frame header #btnScreenToggle");
				this._$btnToggleScreen.on("click", this._toggleFullScreen);
				(document.documentElement as HTMLElement).addEventListener("fullscreentoggled", this._onFullScreenToggled.bind(this), false);
				(document.documentElement as HTMLElement).addEventListener("fullscreenfailed", this._onFullScreenError.bind(this), false);
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
					$(hteCloseBtn).on("click touchstart", () => { // скрываем панель выбора страниц
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
					FullScreenToggler.init(document);
					//
					let $splashscreen: JQuery = $(".app-splashscreen");
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
			} else {
				// Браузер устаревший!
				const strScreenHTML: string =
					`<div class="app-incompatible"> 
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
		public static showTitle(strTitle: string): void {
			if (this._$title) {
				this._$title.hide();
				this._$title.text(strTitle);
				this._$title.fadeIn();
			}
		}


		public static toMasterPage(): void {
			this.toPage(0);
		}

		public static toPage(nPageIndex: number): void {
			const refPage: HTMLElement = this._$pageRefs.get(nPageIndex);
			const strPath: string | undefined = refPage.dataset.uri;
			if (strPath) {
				let page: AppPage;
				if (this._cachePages.contains(strPath)) {
					page = this._cachePages.get(strPath);
				} else {
					if (nPageIndex === 0) {
						page = new MasterPage(strPath);
					} else {
						page = new PresnPage(nPageIndex, strPath);
					}
					//
					if (page && page.life !== PageLifeModes.Discard) {
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
		private static _testCompatibility(): boolean {
			let test: any = (<any>window).Modernizr;
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
		private static _preparePageThumbs($thumbs: JQuery): void {
			$thumbs.each((index: number, hteThumb: HTMLElement) => {
				let oSvgContainer: HTMLObjectElement | null = <HTMLObjectElement>hteThumb.firstElementChild;
				oSvgContainer.dataset.index = (index + 1).toString();
				//
				if (oSvgContainer) {
					let svgDocNow: Document = oSvgContainer.getSVGDocument();
					if (svgDocNow) {
						let textNow: any = svgDocNow.getElementById("text");
						if (textNow) {
							textNow.innerHTML = oSvgContainer.dataset.index;
						}
					}

					oSvgContainer.addEventListener("load", (ev: Event) => {
						let current: HTMLObjectElement = <HTMLObjectElement>ev.currentTarget;
						let svgDoc: Document = current.getSVGDocument();
						let text: any = svgDoc.getElementById("text");
						if (text) {
							text.innerHTML = current.dataset.index;
						
						}
					});
				}
			});
		}

		// Event Handlers
		// -------------------------------------------------------------------
		private static _onPageThumbClick(ev: Event): void {
			if (ev.currentTarget) {
				let nSenderIndex: number = $(ev.currentTarget).index();
				this.toPage(nSenderIndex); // этот индекс должен совпадать с индексом в AppPage
			}
		}


		private static _onPageChanged(sender: any, args: PageChangedEventArgs): void {
			if (args.pageOld) {
				this._$pageRefs.get(args.pageOld.index).classList.remove("current");
			}
			//
			if (args.pageNew) {
				this._nCurrentPageIndex = args.pageNew.index;
				this._$pageRefs.get(args.pageNew.index).classList.add("current");

			}
		}


		private static _onNavpanelClick(ev: JQuery.Event<HTMLElement>) {
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
						const nNewPageIndex: number = this._nCurrentPageIndex + 1;
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
		private static _toggleFullScreen(): void {
			if (FullScreenToggler.getFullScreenElement()) {
				FullScreenToggler.cancelFullScreen();
			} else {
				FullScreenToggler.launchFullScreen(<HTMLElement>document.documentElement);
			}
		}

		private static _onFullScreenToggled(ev: Event): void {
			if (this._$btnToggleScreen) {
				if (FullScreenToggler.getFullScreenElement()) {
					this._$btnToggleScreen.addClass("restorescreen");
				} else {
					this._$btnToggleScreen.removeClass("restorescreen");
				}
			}
		}

		private static _onFullScreenError(ev: Event): void {
			// BookRT.Diagnostics.logError(new WinJS.ErrorFromName("FullScreenError", "full screen error has occurred " + ev.target));
		}


		// Pages Panel
		// -------------------------------------------------------------------

		public static get isPagesPanelVisible(): boolean {
			return this._isPagesPanelVisible;
		}

		public static set isPagesPanelVisible(bVisible: boolean) {
			if (this._$pagesPanel.length > 0 && bVisible !== this._isPagesPanelVisible) {
				if (bVisible === true) {
					let nMoveValue = 10;
					let nTop: number | null = this._positionPagesPanel(nMoveValue);
					if (nTop) {
						this._isPagesPanelVisible = true;
						this._$pagesPanel.addClass("opened");
					}
				} else {
					this._isPagesPanelVisible = false;
					this._$pagesPanel.removeClass("opened");
				}
			}
		}

		private static _positionPagesPanel(nMoveValue: number): number | null {
			if (!nMoveValue) { nMoveValue = 0; }
			//
			if (this._$navpanel) {
				let offsetNavPanel: JQuery.Coordinates | undefined = this._$navpanel.offset();
				let offsetPagePanel: JQuery.Coordinates | undefined = this._$pagesPanel.offset();
				let nPanelHeight: number | undefined = this._$pagesPanel.height();
				if (offsetNavPanel && nPanelHeight) {
					let topNew = (offsetNavPanel.top - nPanelHeight);
					this._$pagesPanel.offset({ top: topNew });
					return topNew;
				}
			}
			//
			return null;
		}


		// State Machine
		// -------------------------------------------------------------------



	} // class MainView

} // namespace MasterDetailApp





