from playwright.sync_api import sync_playwright
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
server=ThreadingHTTPServer(('127.0.0.1',8765),SimpleHTTPRequestHandler)
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=2)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 for path in ['index.html','projects/minefield/index.html','projects/cellular-automaton/index.html','neuronJS/index.html']:
  page.goto('http://127.0.0.1:8765/'+path)
  page.wait_for_timeout(1200)
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),path
  if path=='index.html':
   assert page.locator('.specimen').count()==3
   assert page.locator('.hero').count()==0
   assert 'Each card runs' not in page.locator('body').inner_text()
   assert page.locator('#specimens > .wrap > .specimen-grid').count()==1
  if 'minefield' in path:
   assert page.locator('#canvas').bounding_box()['width']<=500
   page.locator('#canvas').click(position={'x':125,'y':125})
   assert 'safe cells cleared' in page.locator('#game-status').inner_text()
   page.get_by_text('New game').click()
   assert 'Click a cell to start' in page.locator('#game-status').inner_text()
  if 'neuronJS' in path:
   assert page.evaluate('!!window.NeuronSim')
   for name,value in [('tau','40'),('threshold','0.5'),('refractory','12'),('strength','2')]:
    page.locator('#'+name+'-slider').fill(value)
    assert float(page.locator('#'+name+'-out').inner_text())==float(value)
   page.get_by_text('Pause',exact=True).click()
   assert page.evaluate('!NeuronSim.isRunning()')
   page.get_by_text('Reset',exact=True).click()
   for i in range(3):
    page.set_viewport_size({'width':1400+i*10,'height':900})
    assert page.locator('#sim-canvas').bounding_box()['height']==360
  page.evaluate('scrollTo({top:0,behavior:"instant"})')
  page.screenshot(path='/tmp/'+path.replace('/','-')+'.png',full_page=True)
  page.set_viewport_size({'width':390,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),path+' mobile'
  page.set_viewport_size({'width':1440,'height':900})
  print('PASS',path)
 assert not errors,errors
 browser.close()
server.shutdown()
