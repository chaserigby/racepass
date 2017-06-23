states = ['AL','AK','AS','AZ','AR','CA','CO','CT','DE','DC','FL','GA','GU','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MH','MA','MI','FM','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','MP','OH','OK','OR','PW','PA','PR','RI','SC','SD','TN','TX','UT','VT','VA','VI','WA','WV','WI','WY']


import scrapy
import requests
import re
import json

# CURRENTLY this doesn't seem to get the right date for old past races.

def getPrice(prices):
	if prices:
		all_prices = list(map(lambda p: p['priceAmt'], prices))
		return min(all_prices)
	return None

class ActiveSpider(scrapy.Spider):
	name = 'active'
	
	#start_urls = ['http://api.amp.active.com/v2/search?query=running&category=event&topicName=Running&start_date=2017-02-10..&state=UT&per_page=100&sort=date_asc&api_key=abv4cj3xyfpr8bm49mka4ffb&current_page=1']
	start_urls = map(lambda n: 'http://api.amp.active.com/v2/search?query=running&category=event&topicName=Running&start_date=2017-02-10..&state=' + str(n) + '&per_page=100&sort=date_asc&api_key=abv4cj3xyfpr8bm49mka4ffb&current_page=1',
		states)

	def parse(self, response):
		results = json.loads(response.text)
		if results['start_index'] + results['items_per_page'] < results['total_results']:
			yield scrapy.Request(response.url[:response.url.rfind('=')+1] + str(results['start_index']//results['items_per_page'] + 2))
		for d in results['results']:
			p = d['place']
			o = {
				'name': d['assetName'],
				'datetime': d['activityStartDate'],
				'images': list(map(lambda o: o['imageUrlAdr'], d['assetImages'])),
				#'location': {
				'city': p['cityName'],
				'state': p['stateProvinceCode'],
				'country': p['countryCode'],
				'coordinates': p['geoPoint'] if 'geoPoint' in p else None,
				'zip': p['postalCode'],
				'timezone': p['timezone'],
				#},
				'organization': d['organization']['organizationName'],
				'website': d['homePageUrlAdr'],
				'price': str(getPrice(d['assetPrices'])) + ' ' + d['currencyCd']
			}
			yield o
