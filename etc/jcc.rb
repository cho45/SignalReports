#!/usr/bin/env ruby
# coding: UTF-8

require "json"
require "open-uri"

data = []

open('http://www.jarl.or.jp/Japanese/A_Shiryo/A-2_jcc-jcg/jcc-list.txt', 'r:CP932') do |f|
	current = nil
	while l = f.gets
		l.chomp!
		case l
		when /^(?<name>.+) (?<number>\d\d)$/
			number  = Regexp.last_match[:number]
			current = Regexp.last_match[:name].gsub(/\s/, '')
			data << { number: "JCC#{number}", name: current }
		when /^[ *] (?<line>\d\d\d\d(\d\d)? .+)$/
			number, name_a, name = *Regexp.last_match[:line].split(/\s+/)
			data << { number: "JCC#{number}", name: current + name }
		end
	end
end

open('http://www.jarl.or.jp/Japanese/A_Shiryo/A-2_jcc-jcg/jcg-list.txt', 'r:CP932') do |f|
	current = nil
	while l = f.gets
		l.chomp!
		case l
		when /^(?<name>.+) (?<number>\d\d)$/
			current = Regexp.last_match[:name].gsub(/\s/, '')
		when /^[ *] (?<line>\d\d\d\d\d .+)$/
			number, name_a, name = *Regexp.last_match[:line].split(/\s+/)
			data << { number: "JCG#{number}", name: current + name }
		end
	end
end

open('http://www.jarl.or.jp/Japanese/A_Shiryo/A-2_jcc-jcg/ku-list.txt', 'r:CP932') do |f|
	current = nil
	while l = f.gets
		l.chomp!
		case l
		when /^(?<name>.+)\((?<number>\d\d\d\d)\)$/
			current = Regexp.last_match[:name].gsub(/\s/, '')
		when /^(?<line>\d\d\d\d\d\d .+)$/
			number, name_a, name = *Regexp.last_match[:line].split(/\s+/)
			data << { number: "JCC#{number}", name: current + name }
		end
	end
end

require "pp"
data = data.sort_by {|i| i[:number] }

map = {}
data.each_with_index do |item, index|
	4.step(item[:number].size) do |n|
		sub = item[:number][0, n]
		(map[sub] ||= [index, 0])[1] += 1
	end
end

p data[ *map["JCC1001"] ].map {|i| i[:number] }

File.open("static/js/jcc.json", "w") do |f|
	f.puts JSON.generate({
		list: data,
		index: map,
	})
end

