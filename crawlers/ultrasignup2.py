import scrapy
import requests
import re
import copy
import json
from dateutil import parser


class UltraSignUp(scrapy.Spider):
	name = 'UltraSignUp'
	
	#start_urls = ['http://ultrasignup.com/register.aspx?did=43740']
	#start_urls = ['http://ultrasignup.com/service/events.svc/closestevents?lat=0&lng=0&mi=200&mo=12&&m=2&dist=1,10,2,11,3']
	start_urls = map(lambda n: 'http://ultrasignup.com/service/events.svc/closestevents?lat=0&lng=0&mi=200&mo=12&&m=' + str(n) + '&dist=1,10,2,11,3', range(1,13))

	def parse(self, response):
		#if 'data' in response.meta:
		if 'register' in response.url:
			#o = {'datetime': '1/1/2017'}
			o = response.meta['data']
			o['address'] = response.css('.subtitleaddress a::text').extract_first()
			o['details'] = response.css('#ContentPlaceHolder1_EventInfo1_lblRegistrationStatus ::text').extract_first()
			o['url'] = response.url
			prices = {}
			times = {}
			for price_li in response.css('#btnPrices li'):
				price = ' '.join(price_li.css('a span::text').extract())
				print(price)
				parts = price.replace('\n', ' ').split(' - ')
				etype = parts[0]
				cost = parts[len(parts)-1]
				prices[etype] = cost
			for time in response.css('.unit-1 .link-list li'):
				etype = time.css('.times_name::text').extract_first()
				etime = time.css('.times_time::text').extract_first()
				times[etype] = etime
			for etype, ecost in prices.items():
				o2 = copy.copy(o)
				o2['type'] = etype
				o2['price'] = ecost
				o2['datetime'] = o2['datetime'] + ' ' + (times[etype] if etype in times else '')
				try:
					o2['datetime'] = parser.parse(o2['datetime'], fuzzy=True).isoformat()
				except ValueError as e:
					print(e)
				yield o2
		else:
			results = json.loads(response.text)
			for d in results:
				o = {
					'name': d['EventName'],
					'datetime': d['EventDate'],
					'images': ['https://s3.amazonaws.com/img.ultrasignup.com/event/banner/' + d['BannerId']],
					'city': d['City'],
					'state': d['State'],
					'coordinates': {'lat': d['Latitude'] ,'lng': d['Longitude']},
					'organization': d['GroupName'],
					'website': d['EventWebsite'],
				}
				eid =  d['EventId']
				yield scrapy.Request('http://ultrasignup.com/register.aspx?eid='+str(eid), meta={'data': o})
