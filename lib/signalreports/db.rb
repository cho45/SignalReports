require 'sqlite3'
require 'sequel'
Sequel.extension :migration

class SignalReports
	DB = Sequel.connect(settings.db)
	Sequel::Migrator.run(DB, 'migrations', :use_transactions => true)

	class Entry < Sequel::Model
		plugin :force_encoding, 'UTF-8'

		def to_stash
			self.to_hash
		end
	end
end
