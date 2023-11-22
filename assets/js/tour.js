/* global , document, window, wp_tour */
/* eslint camelcase: "off" */

document.addEventListener('DOMContentLoaded', function() {
	var dismissTour;
	document.addEventListener('click', function( event ) {
		if ( ! event.target.matches( '.pulse' ) ) {
			return;
		}
		event.preventDefault();
		const driver = window.driver.js.driver;
		const tourId = event.target.dataset.tourId;
		var startStep = 0;
		if ( typeof tour_plugin.progress[ tourId ] !== 'undefined' ) {
			startStep = tour_plugin.progress[ tourId ] - 1;
		}
		if ( startStep <= 0 ) {
			startStep = 0;
		}
		var tourSteps = tour_plugin.tours[ tourId ].slice(1);
		if ( ! tourSteps.length ) {
			return;
		}

		dismissTour = function() {
			var xhr = new XMLHttpRequest();
			xhr.open('POST', tour_plugin.rest_url + 'tour/v1/save-progress');
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.setRequestHeader('X-WP-Nonce', tour_plugin.nonce);
			xhr.send(JSON.stringify({
				tour: tourId,
				step: tour_plugin.tours[ tourId ].length
			}));

			driverObj.destroy();
		}
		tourSteps[startStep].element = event.target.closest('.pulse-wrapper');
		var driverObj = driver( {
			showProgress: true,
			steps: tourSteps,
			onHighlightStarted: function( element, step, options )  {
				step.popover.description += '<br><a href="" class="dismiss-tour">Dismiss the tour';
			},
			onHighlighted: function( element, step, options )  {
				var xhr = new XMLHttpRequest();
				xhr.open('POST', tour_plugin.rest_url + 'tour/v1/save-progress');
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.setRequestHeader('X-WP-Nonce', tour_plugin.nonce);
				xhr.send(JSON.stringify({
					tour: tourId,
					step: options.state.activeIndex + 1
				}));
			},
			onDestroyStarted: function( element, step, options ) {
				if ( driverObj.hasNextStep() ) {
					addPulse( tourId, options.state.activeIndex + 1 );
				} else {
					var xhr = new XMLHttpRequest();
					xhr.open('POST', tour_plugin.rest_url + 'tour/v1/save-progress');
					xhr.setRequestHeader('Content-Type', 'application/json');
					xhr.setRequestHeader('X-WP-Nonce', tour_plugin.nonce);
					xhr.send(JSON.stringify({
						tour: tourId,
						step: tour_plugin.tours[ tourId ].length
					}));
				}
				driverObj.destroy();
			}
		} );
		driverObj.drive( startStep );
		const pulse = tourSteps[startStep].element.querySelector('.pulse');
		pulse.parentNode.removeChild( pulse );
	} );

	document.addEventListener('click', function( event ) {
		if ( ! event.target.matches( '.dismiss-tour' ) ) {
			return;
		}
		event.preventDefault();
		if ( dismissTour ) {
			dismissTour();
		}
	} );


	function addPulse( tourId, startStep ) {
		let fields;
		if ( startStep === 0 ) {
			startStep = 1;
		}
		if ( tour_plugin.tours[ tourId ].length <= startStep ) {
			return;
		}
		const selector = tour_plugin.tours[ tourId ][ startStep ].element;
		if ( typeof selector === 'string' ) {
			try {
				fields = document.querySelectorAll( selector );
			} catch {
				fields = [];
			}
		} else {
			fields = [ selector ];
		}

		for (let i = 0; i < fields.length; i++) {
			let field = fields[i];
			let wrapper = field.closest('.pulse-wrapper');
			if (!wrapper) {
				if ( field.hasChildNodes() ) {
					wrapper = field;
				} else {
					wrapper = document.createElement('div');
					field.parentNode.insertBefore(wrapper, field);
					wrapper.appendChild(field);
				}
				wrapper.classList.add("pulse-wrapper");
			}
			if ( ! wrapper.querySelector('.pulse') ) {
				const pulse = document.createElement('div');
				pulse.classList.add("pulse");
				pulse.classList.add("tour-" + tourId);
				pulse.dataset.tourId = tourId;
				pulse.dataset.tourTitle = tour_plugin.tours[ tourId ][ 0 ].title;
				if ( field.hasChildNodes() ) {
					wrapper.insertBefore(pulse,wrapper.firstChild);
				} else {
					wrapper.insertBefore(pulse,field);
				}
			}
		}
	}

	const loadTour = function() {
		var color1 = '';
		var color2 = '';
		var styleElement = document.createElement( 'style' );
		var style;
		var startStep;

		document.head.appendChild( styleElement );
		style = styleElement.sheet;

		for ( const tourId in tour_plugin.tours ) {
			color1 = tour_plugin.tours[ tourId ][ 0 ].color;
			color2 = tour_plugin.tours[ tourId ][ 0 ].color + 'a0';
			style.insertRule( '@keyframes animation-' + tourId + ' {' +
				'0% {' +
				'box-shadow: 0 0 0 0 ' + color2 + ';' +
				'}' +
				'70% {' +
				'box-shadow: 0 0 0 10px ' + color1 + '00' + ';' +
				'}' +
				'100% {' +
				'box-shadow: 0 0 0 0 ' + color1 + '00' + ';' +
				'}' +
				'}',
				style.cssRules.length );

			style.insertRule( '.tour-' + tourId + '{' +
				'box-shadow: 0 0 0 ' + color2 + ';' +
				'background: ' + color1 + '80' + ';' +
				'-webkit-animation: animation-' + tourId + ' 2s infinite;' +
				'animation: animation-' + tourId + ' 2s infinite; }',
				style.cssRules.length );
			startStep = 0;
			if ( typeof tour_plugin.progress[ tourId ] !== 'undefined' ) {
				startStep = tour_plugin.progress[ tourId ];
			}
			addPulse( tourId, startStep );
		}
	};
	loadTour();
	filter_available_tours_on_page();
	setTimeout( filter_available_tours_on_masterbar, 500 );

	function filter_available_tours_on_page() {
		let tourListItems = document.querySelectorAll( '#page-tour-list li a' );

		if ( tourListItems ) {
			for ( let i = 0; i < tourListItems.length; i++ ) {
				let _tourId = tourListItems[i].dataset.tourId;
				let tourIsPresent =  tour_plugin.tours[ _tourId ][1] && document.querySelector(tour_plugin.tours[ _tourId ][1].element) ? true : false;
				if (  ! tourIsPresent ) {
					document.querySelector( 'a[data-tour-id="' + _tourId + '"]' ).remove();
				}
			}
		}
	}

	document.addEventListener( 'click', function( event ) {
		if ( ! event.target.matches( '#page-tour-list li a' ) && ! event.target.matches( 'li.admin-bar-tour-item a' ) ) {
			return;
		}
		event.preventDefault();
		let tourId;
		if ( event.target.matches( 'li.admin-bar-tour-item a' ) ) {
			let stringSplit = event.target.parentNode.id.split('-');
			 tourId = stringSplit[stringSplit.length - 1];
		} else {
			 tourId = event.target.getAttribute( 'data-tour-id' );
		}

		let pulseToClick = document.querySelector( '.pulse.tour-' + tourId );

		if ( pulseToClick ){
				pulseToClick.click();
		} else {
			var xhr = new XMLHttpRequest();
			xhr.open('POST', tour_plugin.rest_url + 'tour/v1/save-progress');
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.setRequestHeader('X-WP-Nonce', tour_plugin.nonce);
			xhr.onload = function () {
				if ( xhr.status >= 200 && xhr.status < 300 ) {
					delete tour_plugin.progress[ tourId ];
					loadTour();
					pulseToClick = document.querySelector( '.pulse.tour-' + tourId );
					pulseToClick.click();

				}
			};
			xhr.send( JSON.stringify({
				tour: tourId,
				step: -1
			}));
		}
	} );

	function filter_available_tours_on_masterbar() {
		let tourListItems = document.querySelectorAll( 'li.admin-bar-tour-item' );

		if ( tourListItems ) {
			for ( let i = 0; i < tourListItems.length; i++ ) {
				let stringSplit = tourListItems[i].id.split('-');
				let _tourId = stringSplit[stringSplit.length - 1];

				let tourIsPresent = tour_plugin.tours[ _tourId ][1] && document.querySelector( tour_plugin.tours[ _tourId ][1].element ) ? true : false;
				if (  ! tourIsPresent ) {
					document.querySelector( '#wp-admin-bar-tour-' + _tourId ).remove();
				}
			}
		}

		if ( document.getElementById( 'wp-admin-bar-tour-list-default' ) ) {
			if ( document.getElementById( 'wp-admin-bar-tour-list-default' ).children.length === 0 ) {
				document.getElementById( 'wp-admin-bar-tour-list' ).style.display = 'none';
			}
		}
	}
}
);
