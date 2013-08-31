#!/usr/bin/env ruby


def length(mhz)
	velocity_factor = 0.66

	m = 150.0 / mhz * velocity_factor
	(m * 100).round
end

want = [
	length(21.250),
	length(51),
	length(28),
	length(21),
	length(18.1),
	length(7),
]

p want

want.permutation(2).each do |(a,b)|
	p [a, b, a.lcm(b)]
end
