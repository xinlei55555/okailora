package ca.kailo.berkeley

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.module.kotlin.KotlinFeature
import com.fasterxml.jackson.module.kotlin.readValues
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import java.nio.file.Paths
import java.util.concurrent.ConcurrentHashMap
import org.springframework.stereotype.Component

@Component
class DeploymentRegistry {
    private val file = Paths.get("deployments.yaml").toFile()

    private final val mapper: ObjectMapper =
        ObjectMapper(YAMLFactory())
            .registerKotlinModule {
                enable(KotlinFeature.NullIsSameAsDefault)
                enable(KotlinFeature.NullToEmptyMap)
                enable(KotlinFeature.NullToEmptyCollection)
            }
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, true)

    private val deployments = ConcurrentHashMap<String, Deployment>()

    init {
        if (file.exists()) {
            try {
                val yamlParser = mapper.factory.createParser(file)
                val loaded = mapper.readValues<List<Deployment>>(yamlParser).readAll().firstOrNull()
                loaded?.forEach { deployments[it.id] = it }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun get(deploymentId: String): Deployment? = deployments[deploymentId]

    fun put(deployment: Deployment) {
        deployments[deployment.id] = deployment
        saveToFile()
    }

    fun getAll(): Collection<Deployment> = deployments.values

    private fun saveToFile() {
        try {
            mapper.writeValue(file, deployments.values)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}