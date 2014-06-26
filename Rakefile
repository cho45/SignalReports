


task :test do
	sh %|rspec tests/test.rb|

end

task :karma do
	sh %|karma start|
end

task :e2e do
	warn "require: webdriver-manager start"
	sh %|./tests/e2e/run|
end
