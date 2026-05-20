/**
 * Model configuration: regression coefficients and metadata for every
 * (category, system, klemmung, ausrichtung) combination.
 *
 * Generated upstream by an offline regression script that fits cost
 * curves to AEROCOMPACT's internal pricing dataset. The values are
 * imported here verbatim — do not hand-edit unless you also re-run the
 * regression and accept the new R².
 *
 * Model types:
 *   - "constant":             flat price (`value`)
 *   - "poly_wind":            polynomial in wind only (Flat systems –
 *                             snow does not affect a flat roof)
 *   - "separable_2d":         base + poly(wind) + poly(snow)
 *   - "separable_2d_interp":  base + 1-D interp tables for wind & snow
 *   - "no_data":              admin must add data; user gets "on request"
 *
 * Per-model fields:
 *   wind_range, snow_range:               valid input domains
 *   wind_anfrage_threshold, snow_…:       above this → force "on request"
 *   r_squared, rmse_eur, max_error_eur:   regression quality stats
 */

/** Default model set — shipped with the bundle, overridable via admin UI. */
export const FALLBACK_CONFIG = {
  models: {
    "Flat|S10|Süd|KSK": { kategorie:"Flat",system:"S10",ausrichtung:"Süd",klemmung:"KSK",type:"poly_wind",wind_coef:[-49.383117,160.262987,-74.374026,119.434156],wind_range:[0.1,1.2],wind_anfrage_threshold:1.4,fixed_snow:0.1,r_squared:1.0,max_error_eur:0.0,rmse_eur:0.0,n_data_points:4,polynomial_degree:3},
    "Flat|S10 alpine|Süd|KSK": { kategorie:"Flat",system:"S10 alpine",ausrichtung:"Süd",klemmung:"KSK",type:"poly_wind",wind_coef:[-48.41342,158.244805,-73.463723,198.152338],wind_range:[0.1,1.2],wind_anfrage_threshold:1.4,fixed_snow:0.1,r_squared:1.0,max_error_eur:0.0,rmse_eur:0.0,n_data_points:4,polynomial_degree:3},
    "Flat|S10plus|Ost/West|KSK": { kategorie:"Flat",system:"S10plus",ausrichtung:"Ost/West",klemmung:"KSK",type:"poly_wind",wind_coef:[-12.798457,50.842505,-33.724486,100.993618],wind_range:[0.1,2.0],wind_anfrage_threshold:null,fixed_snow:0.1,r_squared:0.9787,max_error_eur:3.8,rmse_eur:2.02,n_data_points:8,polynomial_degree:3},
    "Flat|S10plus alpine|Ost/West|KSK": { kategorie:"Flat",system:"S10plus alpine",ausrichtung:"Ost/West",klemmung:"KSK",type:"poly_wind",wind_coef:[-12.801736,50.850782,-33.734152,174.094899],wind_range:[0.1,2.0],wind_anfrage_threshold:null,fixed_snow:0.1,r_squared:0.9787,max_error_eur:3.81,rmse_eur:2.02,n_data_points:8,polynomial_degree:3},
    "Flat|SN2|Süd|KSK": { kategorie:"Flat",system:"SN2",ausrichtung:"Süd",klemmung:"KSK",type:"poly_wind",wind_coef:[7.796392,-7.236313,7.721336,173.929294],wind_range:[0.1,2.0],wind_anfrage_threshold:null,fixed_snow:0.1,r_squared:0.9947,max_error_eur:2.21,rmse_eur:1.15,n_data_points:8,polynomial_degree:3},
    "Flat|SN2|Süd|LSK": { kategorie:"Flat",system:"SN2",ausrichtung:"Süd",klemmung:"LSK",type:"poly_wind",wind_coef:[16.150733,-38.026321,31.775007,285.610891],wind_range:[0.1,1.95],wind_anfrage_threshold:null,fixed_snow:0.1,r_squared:0.9777,max_error_eur:2.62,rmse_eur:1.6,n_data_points:8,polynomial_degree:3},
    "Flat|SN2plus|Ost/West|KSK": { kategorie:"Flat",system:"SN2plus",ausrichtung:"Ost/West",klemmung:"KSK",type:"poly_wind",wind_coef:[2.139721,-1.858061,1.58016,112.986119],wind_range:[0.1,2.0],wind_anfrage_threshold:null,fixed_snow:0.1,r_squared:0.9928,max_error_eur:0.56,rmse_eur:0.36,n_data_points:8,polynomial_degree:3},
    "Flat|SN2plus|Ost/West|LSK": { kategorie:"Flat",system:"SN2plus",ausrichtung:"Ost/West",klemmung:"LSK",type:"poly_wind",wind_coef:[1.646949,-0.949879,1.219106,218.839462],wind_range:[0.1,2.0],wind_anfrage_threshold:null,fixed_snow:0.1,r_squared:0.9952,max_error_eur:0.43,rmse_eur:0.27,n_data_points:8,polynomial_degree:3},
    "Flat|S_BASEplus|Ost/West|LSK": { kategorie:"Flat",system:"S_BASEplus",ausrichtung:"Ost/West",klemmung:"LSK",type:"poly_wind",wind_coef:[-0.0,0.0,-0.0,176.36],wind_range:[0.1,2.0],wind_anfrage_threshold:null,fixed_snow:0.1,r_squared:1.0,max_error_eur:0.0,rmse_eur:0.0,n_data_points:8,polynomial_degree:3},
    "Flat|GS10plus|Ost/West|KSK": { kategorie:"Flat",system:"GS10plus",ausrichtung:"Ost/West",klemmung:"KSK",type:"poly_wind",wind_coef:[-13.146223,58.155306,-34.861344,174.557652],wind_range:[0.1,2.0],wind_anfrage_threshold:null,fixed_snow:0.1,r_squared:0.9965,max_error_eur:2.3,rmse_eur:1.29,n_data_points:8,polynomial_degree:3},
    "Flat|GS15|Süd|KSK": { kategorie:"Flat",system:"GS15",ausrichtung:"Süd",klemmung:"KSK",type:"poly_wind",wind_coef:[134.505556,-70.778333,165.762778],wind_range:[0.1,1.0],wind_anfrage_threshold:1.2,fixed_snow:0.1,r_squared:1.0,max_error_eur:0.0,rmse_eur:0.0,n_data_points:3,polynomial_degree:2},
    "Pitch|XM-F|—|—": { kategorie:"Pitch",system:"XM-F",ausrichtung:"—",klemmung:"—",type:"separable_2d",base:198.67,wind_coef:[5.57472,41.425657,-14.779659,0.337444],snow_coef:[1.641144,-5.046522,26.750344,-4.4576],wind_range:[0.1,2.0],snow_range:[0.1,4.0],wind_anfrage_threshold:null,snow_anfrage_threshold:null,wind_r_squared:0.9954,snow_r_squared:0.977,wind_max_error_eur:9.85,snow_max_error_eur:15.02,wind_polynomial_degree:3,snow_polynomial_degree:3},
    "Pitch|XT-R mit Blechersatzziegel|—|—": { kategorie:"Pitch",system:"XT-R mit Blechersatzziegel",ausrichtung:"—",klemmung:"—",type:"separable_2d",base:161.38,wind_coef:[-113.125084,325.201957,-143.981822,11.81147],snow_coef:[-5.216999,48.370248,-3.466768,-0.432242],wind_range:[0.1,1.6],snow_range:[0.1,2.0],wind_anfrage_threshold:1.8,snow_anfrage_threshold:2.5,wind_r_squared:0.9945,snow_r_squared:0.9982,wind_max_error_eur:7.7,snow_max_error_eur:4.0,wind_polynomial_degree:3,snow_polynomial_degree:3},
    "Pitch|XT-R|—|—": { kategorie:"Pitch",system:"XT-R",ausrichtung:"—",klemmung:"—",type:"separable_2d",base:121.74,wind_coef:[-61.051837,179.409772,-83.201622,6.957782],snow_coef:[1.862987,13.692711,4.813569,-0.842983],wind_range:[0.1,1.6],snow_range:[0.1,2.0],wind_anfrage_threshold:1.8,snow_anfrage_threshold:2.5,wind_r_squared:0.9919,snow_r_squared:0.9966,wind_max_error_eur:5.59,snow_max_error_eur:2.96,wind_polynomial_degree:3,snow_polynomial_degree:3},
    "Pitch|XWS|—|—": { kategorie:"Pitch",system:"XWS",ausrichtung:"—",klemmung:"—",type:"no_data",hinweis:"Daten noch nicht hinterlegt — immer Anfrage erforderlich"},
    "Metal|TL|—|—": { kategorie:"Metal",system:"TL",ausrichtung:"—",klemmung:"—",type:"separable_2d",base:49.17,wind_coef:[-10.308374,49.101466,-26.629366,2.191305],snow_coef:[0.195501,1.824233,-4.077209,0.84454],wind_range:[0.1,2.0],snow_range:[0.1,4.0],wind_anfrage_threshold:null,snow_anfrage_threshold:null,wind_r_squared:0.9983,snow_r_squared:0.9489,wind_max_error_eur:1.92,snow_max_error_eur:4.49,wind_polynomial_degree:3,snow_polynomial_degree:3},
    "Metal|TS|—|—": { kategorie:"Metal",system:"TS",ausrichtung:"—",klemmung:"—",type:"separable_2d",base:38.11,wind_coef:[-2.767101,21.319018,-10.769345,0.792004],snow_coef:[1.429861,-6.471519,7.043649,-1.0719],wind_range:[0.1,2.0],snow_range:[0.1,4.0],wind_anfrage_threshold:null,snow_anfrage_threshold:null,wind_r_squared:0.9863,snow_r_squared:0.902,wind_max_error_eur:3.13,snow_max_error_eur:3.01,wind_polynomial_degree:3,snow_polynomial_degree:3},
    "Metal|TLE|—|—": { kategorie:"Metal",system:"TLE",ausrichtung:"—",klemmung:"—",type:"separable_2d_interp",base:48.64,wind_pts:[[0.1,0],[0.5,0],[1.0,14.1625],[1.2,23.5979],[1.4,34.2292],[1.6,42.1472],[1.8,53.4660],[2.0,63.2674]],snow_pts:[[0.1,0],[0.6,0],[1.0,0],[1.5,0],[2.0,16.5167],[2.5,34.7000],[3.0,34.7000],[3.2,34.7000],[3.4,57.4868],[3.6,57.4868],[3.8,57.4868],[4.0,57.4868]],wind_range:[0.1,2.0],snow_range:[0.1,4.0],wind_anfrage_threshold:null,snow_anfrage_threshold:null,wind_max_error_eur:0.0,snow_max_error_eur:0.0,n_data_points:19},
    "Metal|TSE|—|—": { kategorie:"Metal",system:"TSE",ausrichtung:"—",klemmung:"—",type:"no_data",hinweis:"Auf Anfrage verfügbar"},
    "Metal|TR|—|—": { kategorie:"Metal",system:"TR",ausrichtung:"—",klemmung:"—",type:"no_data",hinweis:"Auf Anfrage verfügbar"}
  },
  meta: {
    stand: "04/2026",
    modul: "TSM-NEG9R.25 450W FB",
    hinweis: "Listenpreise je kWp.",
  },
};
