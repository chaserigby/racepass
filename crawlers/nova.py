import scrapy

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start_urls = map(lambda n: 'http://www.novatimingsystems.com/results.aspx?race_id=' + str(n), range(0, 9100))
    #start_urls = ['http://www.novatimingsystems.com/results.aspx?race_id=9004']

    def parse(self, response):
    	data = {
    		'race': {},
    		'results': [],
    		'url': response.url
    	}
    	#data['title'] = 'unknown'
    	for row in response.css('#mainContent > table:first-child > tr:first-child > td:nth-child(2) table tr'):
    		key = ''.join(row.xpath('td[1]//text()').extract()).strip()
    		if key == "Race Name":
    			value = row.xpath("td[2]/select/option[@selected='selected']/text()").extract_first().strip().split(':', 2)[1]
    		else:
    			value = ''.join(row.xpath('td[2]//text()').extract()).strip()
    		data['race'][key] = value

    	headers = []
    	for th in response.css('#ctl00_MainContent_GridView1 tr:first-child th'):
    		h = ''.join(th.xpath('.//text()').extract()).strip()
    		headers.append(h)
    	for row in response.css('#ctl00_MainContent_GridView1 tr:not(:first-child)'):
    		racer = {}
    		for i, td in enumerate(row.css('td')):
    			value = ''.join(td.xpath('.//text()').extract()).strip()
    			racer[headers[i]] = value
    		data['results'].append(racer)
    	yield data
    	#import pprint
    	#pp = pprint.PrettyPrinter(depth=6).pprint(data)
    	#pp.

        #for title in response.css('h2.entry-title'):
        #    yield {'title': title.css('a ::text').extract_first()}

        #next_page = response.css('div.prev-post > a ::attr(href)').extract_first()
        #if next_page:
        #    yield scrapy.Request(response.urljoin(next_page), callback=self.parse)