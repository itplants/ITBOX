import sys
import subprocess

SENSOR_ID = '28-0211917793d2'
SENSOR_W1_SLAVE = "/sys/bus/w1/devices/" + SENSOR_ID + "/w1_slave"
ERR_VAL = 85000

def main():
  res = get_water_temp()
  if res is not None:
    temp_val = res.split("=")
    if temp_val[-1] == ERR_VAL:
      print "Got value:85000. Circuit is ok, but something wrong happens..."
      sys.exit(1)

    temp_val = round(float(temp_val[-1]) / 1000, 1)
    print temp_val
  else:
    print "cannot read the value."
    sys.exit(1)

def get_water_temp():
  try:
    res = subprocess.check_output(["cat", SENSOR_W1_SLAVE])
    return res
  except:
    return None

if __name__ == "__main__":
  main()
