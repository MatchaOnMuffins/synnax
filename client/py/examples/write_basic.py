import numpy as np
import synnax as sy
import matplotlib.pyplot as plt

client = sy.Synnax()

time_ch = client.channels.create(
    name="Time",
    is_index=True,
    data_type=sy.DataType.TIMESTAMP,
)

data_ch = client.channels.create(
    name="Data",
    index=time_ch.key,
    data_type=sy.DataType.FLOAT32,
)

N_SAMPLES = int(5e6)
start = sy.TimeStamp.now()
stamps = np.linspace(int(start), int(start + 100 * sy.TimeSpan.SECOND), N_SAMPLES, dtype=np.int64)
data = np.sin(np.linspace(0, 20 * 2 * np.pi, N_SAMPLES), dtype=np.float32) * 20 + np.random.randint(0, 2, N_SAMPLES).astype(np.float32)

r = sy.TimeRange.MAX
#
time_ch.write(start, stamps)
data_ch.write(start, data)

# time_ch = client.channels.retrieve("Time")
# data_ch = client.channels.retrieve("Data")

print(f"""
    Time channel: {time_ch.key}
    Data channel: {data_ch.key}
""")


res_stamps, _ = time_ch.read(r.start, r.end)
res_data, _ = data_ch.read(r.start, r.end)

plt.plot(res_stamps, res_data)
plt.show()

